import { ArrowDown, ArrowUp, Check, Clock3, Trash2 } from "lucide-react";
import type { PipelineEtapaConfiguracao } from "@/services/usePipelineFunis";

interface PipelineEtapaEditorProps {
  etapa: PipelineEtapaConfiguracao;
  index: number;
  total: number;
  onChange: (etapa: PipelineEtapaConfiguracao) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

const requiredFields = [
  ["nomeEmpresa", "Nome da empresa"],
  ["nomeContato", "Nome do contato"],
  ["telefone", "Telefone"],
  ["email", "E-mail"],
  ["responsavelId", "Responsável"],
  ["dataReuniao", "Data da reunião"],
  ["origemNegocio", "Origem do negócio"],
  ["estrategiaComercial", "Estratégia comercial"],
  ["servicoInteresse", "Serviço de interesse"],
  ["valorEstimadoProposta", "Valor da proposta"],
  ["observacoes", "Observações"],
] as const;

const fieldClass = "h-9 w-full rounded-lg border border-border/30 bg-background/60 px-3 text-[11px] outline-none focus:border-accent/45";
const textAreaClass = "w-full rounded-lg border border-border/30 bg-background/60 px-3 py-2 text-[11px] outline-none focus:border-accent/45";

export const PipelineEtapaEditor = ({ etapa, index, total, onChange, onMove, onRemove }: PipelineEtapaEditorProps) => {
  const toggleRequiredField = (field: string) => {
    const selected = etapa.camposObrigatorios.includes(field);
    onChange({
      ...etapa,
      camposObrigatorios: selected
        ? etapa.camposObrigatorios.filter((item) => item !== field)
        : [...etapa.camposObrigatorios, field],
    });
  };

  return (
    <article className={`rounded-xl border p-4 ${etapa.ativo ? "border-border/25 bg-background/30" : "border-border/15 bg-muted/10 opacity-70"}`}>
      <header className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-[10px] font-bold text-accent">{index + 1}</span><div><p className="text-[11px] font-semibold">{etapa.nome || "Nova etapa"}</p><p className="text-[9px] text-muted-foreground/45">{etapa.sucesso ? "Etapa de sucesso" : etapa.perda ? "Etapa de perda" : "Etapa em andamento"}</p></div></div><div className="flex items-center gap-1"><button type="button" aria-label="Mover etapa para cima" disabled={index === 0} onClick={() => onMove(-1)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/30 disabled:opacity-25"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" aria-label="Mover etapa para baixo" disabled={index === total - 1} onClick={() => onMove(1)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/30 disabled:opacity-25"><ArrowDown className="h-3.5 w-3.5" /></button>{!etapa.id && <button type="button" aria-label="Remover etapa" onClick={onRemove} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}</div></header>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-[10px] font-medium">Nome *<input className={`${fieldClass} mt-1`} value={etapa.nome} onChange={(event) => onChange({ ...etapa, nome: event.target.value })} /></label>
        <label className="text-[10px] font-medium">Tempo máximo de permanência<div className="relative mt-1"><Clock3 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/45" /><input type="number" min="1" className={`${fieldClass} pl-9`} value={etapa.tempoMaximoPermanenciaDias || ""} onChange={(event) => onChange({ ...etapa, tempoMaximoPermanenciaDias: event.target.value ? Number(event.target.value) : null })} placeholder="Dias" /></div></label>
        <label className="text-[10px] font-medium">Objetivo<textarea className={`${textAreaClass} mt-1 min-h-16`} value={etapa.objetivo || ""} onChange={(event) => onChange({ ...etapa, objetivo: event.target.value })} /></label>
        <label className="text-[10px] font-medium">Critérios de conclusão<textarea className={`${textAreaClass} mt-1 min-h-16`} value={etapa.criteriosConclusao || ""} onChange={(event) => onChange({ ...etapa, criteriosConclusao: event.target.value })} /></label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onChange({ ...etapa, sucesso: !etapa.sucesso, perda: false })} className={`rounded-lg border px-3 py-2 text-[10px] font-medium ${etapa.sucesso ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-500" : "border-border/25 text-muted-foreground"}`}>Representa sucesso</button><button type="button" onClick={() => onChange({ ...etapa, perda: !etapa.perda, sucesso: false })} className={`rounded-lg border px-3 py-2 text-[10px] font-medium ${etapa.perda ? "border-red-500/35 bg-red-500/10 text-red-500" : "border-border/25 text-muted-foreground"}`}>Representa perda</button><label className="ml-auto flex cursor-pointer items-center gap-2 text-[10px] font-medium"><button type="button" onClick={() => onChange({ ...etapa, ativo: !etapa.ativo })} className={`flex h-5 w-5 items-center justify-center rounded border ${etapa.ativo ? "border-accent bg-accent text-accent-foreground" : "border-border/40"}`}>{etapa.ativo && <Check className="h-3 w-3" />}</button>Etapa ativa</label></div>

      <div className="mt-4"><p className="text-[10px] font-medium">Campos obrigatórios para entrar/concluir esta etapa</p><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{requiredFields.map(([field, label]) => { const selected = etapa.camposObrigatorios.includes(field); return <button key={field} type="button" onClick={() => toggleRequiredField(field)} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[9px] ${selected ? "border-accent/30 bg-accent/7 text-foreground" : "border-border/20 text-muted-foreground"}`}><span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? "border-accent bg-accent text-accent-foreground" : "border-border/40"}`}>{selected && <Check className="h-3 w-3" />}</span>{label}</button>; })}</div></div>
    </article>
  );
};
