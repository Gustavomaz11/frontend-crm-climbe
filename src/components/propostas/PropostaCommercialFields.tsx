import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { getServiceLabel, SERVICE_OPTIONS, type CommercialService } from "@/services/commercialProposal";
import type { PropostaCommercialConfig, PropostaServicoConfig } from "@/services/usePropostas";
import { calculateProposalReceipts, formatProposalMoney, getAllocatedServices, getServiceAllocationError } from "@/services/proposalPayments";
import type { Usuario } from "@/services/useUsuarios";
import { UserIdentity } from "@/components/users/UserSelect";

type Props = {
  value: PropostaCommercialConfig;
  valorTotal: number;
  usuarios: Usuario[];
  onChange: (value: PropostaCommercialConfig) => void;
};

const fieldClass = "w-full h-9 px-2.5 rounded-lg border border-border/25 bg-background/50 text-[12px] outline-none focus:border-accent/40 text-foreground";
const labelClass = "text-[9px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block";
const sectionClass = "space-y-3 rounded-xl border border-border/20 bg-card/25 p-4";

export const createEmptyProposalConfig = (): PropostaCommercialConfig => ({
  servico: "BPO", servicos: [{ servico: "BPO", valor: 0 }], recebimentos: [],
  mesInicio: "", recorrenciaMeses: 12, quantidadeParcelas: 12, parcelasIguais: true,
  comissaoTecnicoPercentual: null, comissaoComercialPercentual: null,
  equipeTecnicaIds: [], equipeComercialIds: [], reajustes: [], observacoes: "",
});

export const PropostaCommercialFields = ({ value, valorTotal, usuarios, onChange }: Props) => {
  const services = getAllocatedServices(value.servicos, valorTotal);
  const allocationError = valorTotal > 0 ? getServiceAllocationError(services, valorTotal) : null;
  const plan = calculateProposalReceipts(valorTotal, value.quantidadeParcelas ?? 0, value.recebimentos);
  const update = <K extends keyof PropostaCommercialConfig>(field: K, next: PropostaCommercialConfig[K]) => onChange({ ...value, [field]: next });
  const updateService = (index: number, patch: Partial<PropostaServicoConfig>) => update("servicos", services.map((item, current) => current === index ? { ...item, ...patch } : item));
  const addService = () => {
    const next = SERVICE_OPTIONS.find((option) => !services.some((item) => item.servico === option.value));
    if (next) update("servicos", [...services, { servico: next.value, valor: 0 }]);
  };
  const toggleUser = (field: "equipeTecnicaIds" | "equipeComercialIds", id: number) => update(field,
    value[field].includes(id) ? value[field].filter((item) => item !== id) : [...value[field], id]);

  return (
    <div className="mt-3 space-y-3">
      <section className={sectionClass} tabIndex={-1} role="group" aria-label="Distribuição entre serviços" data-validation-message={allocationError || undefined}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="text-[12px] font-semibold">Serviços da proposta *</h3><p className="text-[10px] text-muted-foreground">Distribua o valor total e configure as comissões de cada serviço.</p></div>
          <button type="button" onClick={addService} disabled={services.length >= SERVICE_OPTIONS.length} className="flex h-8 items-center gap-1 rounded-lg border border-border/30 px-3 text-[11px] disabled:opacity-40"><Plus className="h-3 w-3" />Adicionar serviço</button>
        </div>
        {services.map((service, index) => (
          <fieldset key={index} className="rounded-lg border border-border/25 p-3">
            <legend className="px-1 text-[11px] font-semibold">Serviço {index + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className={labelClass}>Serviço {index + 1} *</span><select required className={fieldClass} value={service.servico} onChange={(event) => updateService(index, { servico: event.target.value as CommercialService })}>{SERVICE_OPTIONS.map((item) => <option key={item.value} value={item.value} disabled={services.some((other, current) => current !== index && other.servico === item.value)}>{item.label}</option>)}</select></label>
              <label><span className={labelClass}>Valor do serviço {index + 1} (R$) *</span><input required type="number" min={0.01} step="0.01" readOnly={services.length === 1} className={fieldClass} value={service.valor || ""} onChange={(event) => updateService(index, { valor: Number(event.target.value) })} /></label>
              <label><span className={labelClass}>Comissão técnica do serviço {index + 1} (%)</span><input type="number" min={0} max={100} step="0.01" placeholder="Padrão: 30%" className={fieldClass} value={service.comissaoTecnicoPercentual ?? ""} onChange={(event) => updateService(index, { comissaoTecnicoPercentual: event.target.value ? Number(event.target.value) : null })} /><small className="text-[10px] text-muted-foreground">{formatProposalMoney(service.valor * (service.comissaoTecnicoPercentual ?? 30) / 100)} de {getServiceLabel(service.servico)}</small></label>
              <label><span className={labelClass}>Comissão comercial do serviço {index + 1} (%)</span><input type="number" min={0} max={100} step="0.01" placeholder="Padrão: 20%" className={fieldClass} value={service.comissaoComercialPercentual ?? ""} onChange={(event) => updateService(index, { comissaoComercialPercentual: event.target.value ? Number(event.target.value) : null })} /><small className="text-[10px] text-muted-foreground">{formatProposalMoney(service.valor * (service.comissaoComercialPercentual ?? 20) / 100)} de {getServiceLabel(service.servico)}</small></label>
            </div>
            {services.length > 1 && <button type="button" onClick={() => update("servicos", services.filter((_, current) => current !== index))} className="mt-2 flex items-center gap-1 text-[10px] text-destructive"><Trash2 className="h-3 w-3" />Remover serviço {index + 1}</button>}
          </fieldset>
        ))}
        <p className={`text-[11px] ${allocationError ? "text-destructive" : "text-accent"}`}>{allocationError || `Valor distribuído: ${formatProposalMoney(services.reduce((sum, item) => sum + item.valor, 0))}`}</p>
      </section>

      <section className={sectionClass} tabIndex={-1} role="group" aria-label="Plano de recebimentos" data-validation-message={valorTotal > 0 ? plan.error || undefined : undefined}>
        <h3 className="text-[12px] font-semibold">Recebimentos da proposta</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className={labelClass}>Mês de início *</span><input required className={fieldClass} type="month" value={value.mesInicio || ""} onChange={(event) => update("mesInicio", event.target.value)} /></label>
          <label><span className={labelClass}>Quantidade de recebimentos *</span><input required className={fieldClass} type="number" min={1} max={24} step={1} value={value.quantidadeParcelas ?? ""} onChange={(event) => {
            const count = event.target.value ? Number(event.target.value) : null;
            onChange({ ...value, quantidadeParcelas: count, recebimentos: value.recebimentos.filter((item) => item.numero <= (count ?? 0)) });
          }} /></label>
        </div>
        <p className="text-[10px] text-muted-foreground">Personalize os recebimentos que desejar. O saldo será distribuído automaticamente entre os demais, mantendo o valor total da proposta.</p>
        {!!value.recebimentos.length && <button type="button" onClick={() => update("recebimentos", [])} className="flex items-center gap-1 text-[10px] text-accent"><RotateCcw className="h-3 w-3" />Restaurar divisão automática</button>}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {plan.recebimentos.map((receipt) => {
            const custom = value.recebimentos.some((item) => item.numero === receipt.numero);
            return <div key={receipt.numero} className="rounded-lg border border-border/25 p-2.5">
              <label className="mb-2 flex items-center gap-2 text-[10px]"><input type="checkbox" checked={custom} onChange={(event) => update("recebimentos", event.target.checked ? [...value.recebimentos, receipt] : value.recebimentos.filter((item) => item.numero !== receipt.numero))} />Personalizar recebimento {receipt.numero}</label>
              <label><span className={labelClass}>Valor do recebimento {receipt.numero} (R$) *</span><input required type="number" min={0.01} step="0.01" readOnly={!custom} value={receipt.valor || ""} className={`${fieldClass} read-only:opacity-70`} onChange={(event) => update("recebimentos", value.recebimentos.map((item) => item.numero === receipt.numero ? { ...item, valor: Number(event.target.value) } : item))} /></label>
            </div>;
          })}
        </div>
        <p className={`text-[11px] ${plan.error && valorTotal > 0 ? "text-destructive" : "text-accent"}`}>{valorTotal > 0 ? plan.error || `Total dos recebimentos: ${formatProposalMoney(plan.recebimentos.reduce((sum, item) => sum + item.valor, 0))}` : "Informe o valor total para visualizar os recebimentos."}</p>
      </section>

      <section className={sectionClass}>
        <div className="grid gap-3 md:grid-cols-2">
          {(["equipeTecnicaIds", "equipeComercialIds"] as const).map((field) => <div key={field}><span className={labelClass}>{field === "equipeTecnicaIds" ? "Equipe técnica padrão" : "Equipe comercial padrão"}</span><div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border/20 bg-background/35 p-2">{usuarios.map((usuario) => <label key={usuario.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-foreground/70 hover:bg-muted/20"><input type="checkbox" checked={value[field].includes(usuario.id)} onChange={() => toggleUser(field, usuario.id)} /><UserIdentity user={usuario} className="min-w-0 flex-1" /></label>)}</div></div>)}
        </div>
        <label className="block"><span className={labelClass}>Observações</span><textarea className="min-h-20 w-full rounded-lg border border-border/25 bg-background/50 px-3 py-2 text-[12px] outline-none focus:border-accent/40" value={value.observacoes || ""} onChange={(event) => update("observacoes", event.target.value)} /></label>
      </section>
    </div>
  );
};
