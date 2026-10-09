import { getServiceLabel, isRecurringService, type CommercialService } from "./commercialProposal";
import type { PropostaCommercialConfig, PropostaRecebimento, PropostaServicoConfig } from "./usePropostas";

export const formatProposalMoney = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const cents = (value: number) => Math.round(value * 100);

export const getProposalServicesLabel = (proposal: { servico?: CommercialService | null; servicos?: { servico: CommercialService }[] }) =>
  proposal.servicos?.length ? proposal.servicos.map((item) => getServiceLabel(item.servico)).join(" + ") : getServiceLabel(proposal.servico);

export const getAllocatedServices = (services: PropostaServicoConfig[], total: number) =>
  services.length === 1 ? [{ ...services[0], valor: total }] : services;

export function getServiceAllocationError(services: PropostaServicoConfig[], total: number): string | null {
  if (!services.length) return "Adicione pelo menos um serviço à proposta.";
  if (new Set(services.map((item) => item.servico)).size !== services.length) return "Selecione cada serviço apenas uma vez.";
  if (services.some((item) => !Number.isFinite(item.valor) || item.valor <= 0)) return "Informe o valor destinado a cada serviço.";
  const allocated = services.reduce((sum, item) => sum + cents(item.valor), 0);
  if (allocated !== cents(total)) return `A soma dos serviços deve ser ${formatProposalMoney(total)}. ${allocated < cents(total) ? "Falta distribuir" : "O valor excede o total em"} ${formatProposalMoney(Math.abs(cents(total) - allocated) / 100)}.`;
  return null;
}

export function calculateProposalReceipts(total: number, count: number, custom: PropostaRecebimento[] = []) {
  const invalid = (error: string) => ({ recebimentos: [] as PropostaRecebimento[], error });
  if (!Number.isInteger(count) || count < 1 || count > 24) return invalid("Informe entre 1 e 24 recebimentos.");
  if (!Number.isSafeInteger(cents(total)) || total <= 0) return invalid("Informe o valor total da proposta para configurar os recebimentos.");
  const fixed = new Map(custom.map((item) => [item.numero, cents(item.valor)]));
  if (fixed.size !== custom.length || custom.some((item) => !Number.isInteger(item.numero) || item.numero < 1 || item.numero > count || !Number.isFinite(item.valor))) {
    return invalid("Confira os recebimentos personalizados.");
  }
  const remaining = cents(total) - [...fixed.values()].reduce((sum, value) => sum + value, 0);
  const automatic = count - fixed.size;
  const base = automatic ? Math.floor(Math.max(0, remaining) / automatic) : 0;
  let extra = automatic ? Math.max(0, remaining) % automatic : 0;
  const recebimentos = Array.from({ length: count }, (_, index) => {
    const numero = index + 1;
    const valor = fixed.has(numero) ? fixed.get(numero)! : base + (extra-- > 0 ? 1 : 0);
    return { numero, valor: valor / 100 };
  });
  const error = recebimentos.some((item) => item.valor <= 0)
    ? "Cada recebimento precisa ser maior que zero. Deixe saldo para os recebimentos automáticos."
    : remaining < 0 || (!automatic && remaining !== 0)
      ? `A soma dos recebimentos deve ser ${formatProposalMoney(total)}. Confira os valores personalizados.` : null;
  return { recebimentos, error };
}

/** Converts the previous monthly total into service amounts, preserving every cent. */
export const getReceiptServiceValues = (receipt: PropostaRecebimento, services: PropostaServicoConfig[]) => {
  if (receipt.servicos) return services.map(({ servico }) => ({ servico, valor: receipt.servicos?.find((item) => item.servico === servico)?.valor ?? 0 }));
  if (!Number.isSafeInteger(cents(receipt.valor))) return services.map(({ servico }) => ({ servico, valor: 0 }));
  const total = services.reduce((sum, item) => sum + cents(item.valor), 0);
  let allocated = 0;
  return services.map(({ servico, valor }, index) => {
    const amount = index === services.length - 1 ? cents(receipt.valor) - allocated
      : total > 0 ? Number(BigInt(cents(receipt.valor)) * BigInt(cents(valor)) / BigInt(total)) : 0;
    allocated += amount;
    return { servico, valor: amount / 100 };
  });
};

const getReceiptServicesError = (receipt: PropostaRecebimento, services: PropostaServicoConfig[]) => {
  if (!Number.isSafeInteger(cents(receipt.valor)) || receipt.valor < 0) return "Confira os valores dos recebimentos personalizados.";
  if (!receipt.servicos) return null;
  const selected = new Set(services.map((item) => item.servico));
  const amounts = receipt.servicos;
  if (amounts.length !== selected.size || new Set(amounts.map((item) => item.servico)).size !== amounts.length
    || amounts.some((item) => !selected.has(item.servico))) return `Informe todos os serviços no recebimento ${receipt.numero}, sem repetir serviços.`;
  if (amounts.some((item) => !Number.isSafeInteger(cents(item.valor)) || item.valor < 0)) return `Informe valores a partir de zero para os serviços do recebimento ${receipt.numero}.`;
  if (amounts.reduce((sum, item) => sum + cents(item.valor), 0) !== cents(receipt.valor)) return `O total do recebimento ${receipt.numero} deve ser a soma dos seus serviços.`;
  return null;
};

const distributeServiceReceipts = (service: PropostaServicoConfig, count: number, custom: PropostaRecebimento[]) => {
  const fixed = new Map(custom.map((receipt) => {
    const amount = receipt.servicos!.find((item) => item.servico === service.servico)!.valor;
    return [receipt.numero, Number.isSafeInteger(cents(amount)) ? cents(amount) : 0];
  }));
  const remaining = cents(service.valor) - [...fixed.values()].reduce((sum, amount) => sum + amount, 0);
  const automatic = count - fixed.size;
  const base = automatic ? Math.floor(Math.max(0, remaining) / automatic) : 0;
  let extra = automatic ? Math.max(0, remaining) % automatic : 0;
  const values = Array.from({ length: count }, (_, index) => fixed.get(index + 1) ?? base + (extra-- > 0 ? 1 : 0));
  const error = remaining < 0 ? `Os recebimentos de ${getServiceLabel(service.servico)} excedem o valor destinado a esse serviço em ${formatProposalMoney(-remaining / 100)}.`
    : !automatic && remaining !== 0 ? `A soma dos recebimentos de ${getServiceLabel(service.servico)} deve ser ${formatProposalMoney(service.valor)}.` : null;
  return { values, error };
};

export const calculateProposalServiceReceipts = (services: PropostaServicoConfig[], total: number, count: number, custom: PropostaRecebimento[] = []): { recebimentos: PropostaRecebimento[]; error: string | null } => {
  const initial = calculateProposalReceipts(total, count);
  if (!initial.recebimentos.length) return initial;
  if (new Set(custom.map((item) => item.numero)).size !== custom.length
    || custom.some((item) => !Number.isInteger(item.numero) || item.numero < 1 || item.numero > count)) return { ...initial, error: "Confira os recebimentos personalizados." };
  const customError = custom.map((receipt) => getReceiptServicesError(receipt, services)).find(Boolean);
  const validServices = services.map((service) => ({ ...service, valor: Number.isSafeInteger(cents(service.valor)) && service.valor >= 0 ? service.valor : 0 }));
  const normalized = custom.map((receipt) => ({ ...receipt, servicos: getReceiptServiceValues(receipt, validServices) }));
  const plans = validServices.map((service) => ({ service, ...distributeServiceReceipts(service, count, normalized) }));
  const recebimentos = initial.recebimentos.map(({ numero }) => {
    const fixed = normalized.find((receipt) => receipt.numero === numero);
    const servicos = fixed?.servicos ?? plans.map(({ service, values }) => ({ servico: service.servico, valor: values[numero - 1] / 100 }));
    return { numero, servicos, valor: servicos.reduce((sum, item) => sum + (Number.isSafeInteger(cents(item.valor)) ? cents(item.valor) : 0), 0) / 100 };
  });
  const error = customError || plans.find((plan) => plan.error)?.error || getServiceAllocationError(services, total)
    || (recebimentos.some((receipt) => receipt.valor <= 0) ? "Cada mês precisa ter um recebimento maior que zero. Redistribua os valores dos serviços." : null);
  return { recebimentos, error };
};

export function buildProposalCommercialConfig(config: PropostaCommercialConfig, total: number): PropostaCommercialConfig {
  const servicos = getAllocatedServices(config.servicos, total);
  const allocationError = getServiceAllocationError(servicos, total);
  if (allocationError) throw new Error(allocationError);
  const count = config.quantidadeParcelas ?? 0;
  const plan = calculateProposalServiceReceipts(servicos, total, count, config.recebimentos);
  if (plan.error) throw new Error(plan.error);
  const first = servicos[0];
  return { ...config, servicos, recebimentos: plan.recebimentos, servico: first.servico,
    recorrenciaMeses: isRecurringService(first.servico) ? count : null, parcelasIguais: !config.recebimentos.length,
    comissaoTecnicoPercentual: first.comissaoTecnicoPercentual ?? null,
    comissaoComercialPercentual: first.comissaoComercialPercentual ?? null, reajustes: [] };
}
