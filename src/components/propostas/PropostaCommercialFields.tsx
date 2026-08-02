import { Plus, Trash2 } from "lucide-react";
import {
  getServiceLabel,
  isRecurringService,
  SERVICE_OPTIONS,
  type PropostaCommercialConfig,
} from "@/services";
import type { Usuario } from "@/services/useUsuarios";
import { UserIdentity } from "@/components/users/UserSelect";

type Props = {
  value: PropostaCommercialConfig;
  usuarios: Usuario[];
  onChange: (value: PropostaCommercialConfig) => void;
};

const fieldClass = "w-full h-9 px-2.5 rounded-lg border border-border/25 bg-background/50 text-[12px] outline-none focus:border-accent/40 text-foreground";
const labelClass = "text-[9px] text-muted-foreground/45 font-medium uppercase tracking-wider mb-1 block";

export const createEmptyProposalConfig = (): PropostaCommercialConfig => ({
  servico: "BPO",
  mesInicio: "",
  recorrenciaMeses: 0,
  quantidadeParcelas: 1,
  parcelasIguais: true,
  comissaoTecnicoPercentual: null,
  comissaoComercialPercentual: null,
  equipeTecnicaIds: [],
  equipeComercialIds: [],
  reajustes: [],
  observacoes: "",
});

export const PropostaCommercialFields = ({ value, usuarios, onChange }: Props) => {
  const recurring = isRecurringService(value.servico);
  const update = <K extends keyof PropostaCommercialConfig>(field: K, next: PropostaCommercialConfig[K]) =>
    onChange({ ...value, [field]: next });
  const toggleUser = (field: "equipeTecnicaIds" | "equipeComercialIds", id: number) => {
    const current = value[field];
    update(field, current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const addAdjustment = () => update("reajustes", [...value.reajustes, { mesVigencia: 2, valor: 0 }]);

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border/20 bg-card/25 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label><span className={labelClass}>Serviço *</span><select className={fieldClass} value={value.servico} onChange={(event) => update("servico", event.target.value as PropostaCommercialConfig["servico"])}>{SERVICE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label><span className={labelClass}>Mês de início *</span><input className={fieldClass} type="month" value={value.mesInicio || ""} onChange={(event) => update("mesInicio", event.target.value)} /></label>
        {recurring ? (
          <label><span className={labelClass}>Recorrência (0 a 24 meses)</span><input className={fieldClass} type="number" min={0} max={24} value={value.recorrenciaMeses ?? 0} onChange={(event) => update("recorrenciaMeses", Number(event.target.value))} /><small className="text-[10px] text-muted-foreground/40">0 significa prazo indeterminado.</small></label>
        ) : (
          <>
            <label><span className={labelClass}>Quantidade de parcelas</span><input className={fieldClass} type="number" min={1} max={24} value={value.quantidadeParcelas ?? 1} onChange={(event) => update("quantidadeParcelas", Number(event.target.value))} /></label>
            <label className="flex items-center gap-2 pt-5 text-[11px] text-foreground/70"><input type="checkbox" checked={value.parcelasIguais} onChange={(event) => update("parcelasIguais", event.target.checked)} /> Dividir o valor total em parcelas iguais</label>
          </>
        )}
        <label><span className={labelClass}>Comissão técnico %</span><input className={fieldClass} type="number" min={0} max={100} step="0.01" placeholder="Padrão: 30%" value={value.comissaoTecnicoPercentual ?? ""} onChange={(event) => update("comissaoTecnicoPercentual", event.target.value ? Number(event.target.value) : null)} /></label>
        <label><span className={labelClass}>Comissão comercial %</span><input className={fieldClass} type="number" min={0} max={100} step="0.01" placeholder="Padrão: 20%" value={value.comissaoComercialPercentual ?? ""} onChange={(event) => update("comissaoComercialPercentual", event.target.value ? Number(event.target.value) : null)} /></label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between"><div><span className={labelClass}>Reajustes/valores personalizados</span><p className="text-[10px] text-muted-foreground/40">Mês contado a partir do início do contrato de {getServiceLabel(value.servico)}.</p></div><button type="button" onClick={addAdjustment} className="h-8 px-3 rounded-lg border border-border/30 text-[11px] flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</button></div>
        <div className="space-y-2">{value.reajustes.map((item, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2"><input aria-label="Mês de vigência" className={fieldClass} type="number" min={1} max={24} value={item.mesVigencia} onChange={(event) => update("reajustes", value.reajustes.map((row, rowIndex) => rowIndex === index ? { ...row, mesVigencia: Number(event.target.value) } : row))} /><input aria-label="Valor do reajuste" className={fieldClass} type="number" min={0.01} step="0.01" value={item.valor || ""} placeholder="Valor em R$" onChange={(event) => update("reajustes", value.reajustes.map((row, rowIndex) => rowIndex === index ? { ...row, valor: Number(event.target.value) } : row))} /><button type="button" aria-label="Remover reajuste" onClick={() => update("reajustes", value.reajustes.filter((_, rowIndex) => rowIndex !== index))} className="w-9 h-9 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 mx-auto" /></button></div>)}</div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(["equipeTecnicaIds", "equipeComercialIds"] as const).map((field) => <div key={field}><span className={labelClass}>{field === "equipeTecnicaIds" ? "Equipe técnica padrão" : "Equipe comercial padrão"}</span><div className="max-h-40 overflow-y-auto rounded-lg border border-border/20 bg-background/35 p-2 space-y-1">{usuarios.map((usuario) => <label key={usuario.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-foreground/70 hover:bg-muted/20"><input type="checkbox" checked={value[field].includes(usuario.id)} onChange={() => toggleUser(field, usuario.id)} /><UserIdentity user={usuario} className="min-w-0 flex-1" /></label>)}</div></div>)}
      </div>
      <label><span className={labelClass}>Observações</span><textarea className="w-full min-h-20 px-3 py-2 rounded-lg border border-border/25 bg-background/50 text-[12px] outline-none focus:border-accent/40" value={value.observacoes || ""} onChange={(event) => update("observacoes", event.target.value)} /></label>
    </div>
  );
};
