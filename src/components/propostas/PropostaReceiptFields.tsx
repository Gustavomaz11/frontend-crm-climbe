import { RotateCcw } from "lucide-react";
import { getServiceLabel, type CommercialService } from "@/services/commercialProposal";
import { calculateProposalServiceReceipts, formatProposalMoney, getReceiptServiceValues } from "@/services/proposalPayments";
import type { PropostaCommercialConfig, PropostaRecebimento, PropostaServicoConfig } from "@/services/usePropostas";

const fieldClass = "h-9 w-full rounded-lg border border-border/25 bg-background/50 px-2.5 text-[12px] text-foreground outline-none focus:border-accent/40 read-only:opacity-70";
const labelClass = "mb-1 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground";
const monthLabel = (start: string | null | undefined, numero: number) => {
  if (!start || !/^\d{4}-\d{2}$/.test(start)) return "";
  const [year, month] = start.split("-").map(Number);
  return new Date(Date.UTC(year, month + numero - 2, 1)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
};

const ReceiptCard = ({ receipt, services, custom, month, onToggle, onChange }: {
  receipt: PropostaRecebimento; services: PropostaServicoConfig[]; custom: boolean; month: string;
  onToggle: (checked: boolean) => void; onChange: (servico: CommercialService, valor: number) => void;
}) => <div className="min-w-0 space-y-3 rounded-lg border border-border/25 p-3">
  <div><h4 className="text-[11px] font-semibold">Recebimento {receipt.numero}{month && ` · ${month}`}</h4>
    <label className="mt-2 flex items-center gap-2 text-[10px]"><input type="checkbox" checked={custom} onChange={(event) => onToggle(event.target.checked)} />Personalizar recebimento {receipt.numero}</label></div>
  {getReceiptServiceValues(receipt, services).map((item) => <label key={item.servico} className="block">
    <span className={labelClass}>Valor de {getServiceLabel(item.servico)} no recebimento {receipt.numero} (R$) *</span>
    <input required type="number" min={0} step="0.01" readOnly={!custom} value={Number.isFinite(item.valor) ? item.valor : ""} className={fieldClass} onChange={(event) => onChange(item.servico, event.target.value === "" ? Number.NaN : Number(event.target.value))} />
  </label>)}
  <p className="flex flex-wrap justify-between gap-1 border-t border-border/25 pt-2 text-[11px] font-semibold"><span>Total do mês</span><output aria-label={`Total do recebimento ${receipt.numero}`} className="text-accent">{formatProposalMoney(receipt.valor)}</output></p>
</div>;

export const PropostaReceiptFields = ({ value, services, valorTotal, onChange }: {
  value: PropostaCommercialConfig; services: PropostaServicoConfig[]; valorTotal: number;
  onChange: (value: PropostaCommercialConfig) => void;
}) => {
  const plan = calculateProposalServiceReceipts(services, valorTotal, value.quantidadeParcelas ?? 0, value.recebimentos);
  const update = (recebimentos: PropostaRecebimento[]) => onChange({ ...value, recebimentos });
  const changeAmount = (receipt: PropostaRecebimento, servico: CommercialService, valor: number) => {
    const servicos = getReceiptServiceValues(receipt, services).map((item) => item.servico === servico ? { ...item, valor } : item);
    const next = { ...receipt, servicos, valor: servicos.reduce((sum, item) => sum + (Number.isFinite(item.valor) ? Math.round(item.valor * 100) : 0), 0) / 100 };
    update(value.recebimentos.map((item) => item.numero === receipt.numero ? next : item));
  };
  return <section className="space-y-3 rounded-xl border border-border/20 bg-card/25 p-4" tabIndex={-1} role="group" aria-label="Plano de recebimentos" data-validation-message={valorTotal > 0 ? plan.error || undefined : undefined}>
    <h3 className="text-[12px] font-semibold">Recebimentos da proposta</h3>
    <div className="grid gap-3 sm:grid-cols-2">
      <label><span className={labelClass}>Mês de início *</span><input required className={fieldClass} type="month" value={value.mesInicio || ""} onChange={(event) => onChange({ ...value, mesInicio: event.target.value })} /></label>
      <label><span className={labelClass}>Quantidade de recebimentos *</span><input required className={fieldClass} type="number" min={1} max={24} step={1} value={value.quantidadeParcelas ?? ""} onChange={(event) => {
        const count = event.target.value ? Number(event.target.value) : null;
        onChange({ ...value, quantidadeParcelas: count, recebimentos: value.recebimentos.filter((item) => item.numero <= (count ?? 0)) });
      }} /></label>
    </div>
    <p className="text-[10px] text-muted-foreground">Personalize o valor de cada serviço no mês desejado. O total do mês é a soma dos serviços. O saldo de cada serviço será distribuído entre os meses automáticos. Use zero se um serviço não for pago naquele mês.</p>
    {!!value.recebimentos.length && <button type="button" onClick={() => update([])} className="flex items-center gap-1 text-[10px] text-accent"><RotateCcw className="h-3 w-3" />Restaurar divisão automática</button>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {plan.recebimentos.map((receipt) => <ReceiptCard key={receipt.numero} receipt={receipt} services={services} month={monthLabel(value.mesInicio, receipt.numero)} custom={value.recebimentos.some((item) => item.numero === receipt.numero)}
        onToggle={(checked) => update(checked ? [...value.recebimentos, { ...receipt, servicos: getReceiptServiceValues(receipt, services) }] : value.recebimentos.filter((item) => item.numero !== receipt.numero))}
        onChange={(servico, valor) => changeAmount(receipt, servico, valor)} />)}
    </div>
    <p className={`text-[11px] ${plan.error && valorTotal > 0 ? "text-destructive" : "text-accent"}`}>{valorTotal > 0 ? plan.error || `Total dos recebimentos: ${formatProposalMoney(plan.recebimentos.reduce((sum, item) => sum + Math.round(item.valor * 100), 0) / 100)}` : "Informe o valor total para visualizar os recebimentos."}</p>
  </section>;
};
