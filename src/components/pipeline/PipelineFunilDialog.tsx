import { useMemo, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import type { PipelineEtapaConfiguracao, PipelineFunil, PipelineFunilInput } from "@/services/usePipelineFunis";
import { PipelineEtapaEditor } from "./PipelineEtapaEditor";

interface PipelineFunilDialogProps {
  funil?: PipelineFunil | null;
  isProcessing: boolean;
  onClose: () => void;
  onSave: (data: PipelineFunilInput) => void;
}

const newStage = (name = ""): PipelineEtapaConfiguracao => ({
  nome: name,
  objetivo: "",
  criteriosConclusao: "",
  tempoMaximoPermanenciaDias: null,
  sucesso: false,
  perda: false,
  camposObrigatorios: [],
  ativo: true,
});

const defaultStages = [newStage("Primeiro contato"), { ...newStage("Fechado"), sucesso: true }, { ...newStage("Perdido"), perda: true }];
const fieldClass = "h-10 w-full rounded-lg border border-border/30 bg-background/60 px-3 text-[11px] outline-none focus:border-accent/45";

export const PipelineFunilDialog = ({ funil, isProcessing, onClose, onSave }: PipelineFunilDialogProps) => {
  const initial = useMemo<PipelineFunilInput>(() => ({
    nome: funil?.nome || "",
    descricao: funil?.descricao || "",
    estrategia: funil?.estrategia || "",
    ativo: funil?.ativo ?? true,
    etapas: funil?.etapas.map((stage) => ({ ...stage, camposObrigatorios: [...stage.camposObrigatorios] })) || defaultStages,
  }), [funil]);
  const [draft, setDraft] = useState(initial);

  const updateStage = (index: number, stage: PipelineEtapaConfiguracao) => setDraft((current) => ({ ...current, etapas: current.etapas.map((item, itemIndex) => itemIndex === index ? stage : item) }));
  const moveStage = (index: number, direction: -1 | 1) => setDraft((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.etapas.length) return current;
    const etapas = [...current.etapas];
    [etapas[index], etapas[target]] = [etapas[target], etapas[index]];
    return { ...current, etapas };
  });
  const removeStage = (index: number) => setDraft((current) => ({ ...current, etapas: current.etapas.filter((_, itemIndex) => itemIndex !== index) }));
  const valid = draft.nome.trim() && draft.estrategia.trim() && draft.etapas.length > 0
    && draft.etapas.every((stage) => stage.nome.trim()) && draft.etapas.some((stage) => stage.ativo);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-label={funil ? "Editar funil" : "Novo funil"} className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border/30 bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border/20 px-6 py-4"><div><h2 className="text-[16px] font-semibold">{funil ? "Configurar funil" : "Novo funil comercial"}</h2><p className="mt-0.5 text-[10px] text-muted-foreground/50">Defina o processo completo sem alterar o código-fonte.</p></div><button type="button" onClick={onClose} disabled={isProcessing} className="rounded-lg p-2 hover:bg-muted/30"><X className="h-4 w-4" /></button></header>

        <div className="space-y-5 overflow-y-auto p-6">
          <section className="grid gap-4 rounded-xl border border-border/20 bg-background/25 p-4 md:grid-cols-2"><label className="text-[10px] font-medium">Nome do funil *<input className={`${fieldClass} mt-1`} value={draft.nome} onChange={(event) => setDraft({ ...draft, nome: event.target.value })} placeholder="Ex.: Consultoria patrimonial" /></label><label className="text-[10px] font-medium">Estratégia relacionada *<input className={`${fieldClass} mt-1`} value={draft.estrategia} onChange={(event) => setDraft({ ...draft, estrategia: event.target.value })} placeholder="Ex.: Venda consultiva" /></label><label className="text-[10px] font-medium md:col-span-2">Descrição<textarea className={`${fieldClass} mt-1 min-h-20 py-2`} value={draft.descricao || ""} onChange={(event) => setDraft({ ...draft, descricao: event.target.value })} /></label><label className="flex cursor-pointer items-center gap-2 text-[10px] font-medium"><input type="checkbox" checked={draft.ativo} onChange={(event) => setDraft({ ...draft, ativo: event.target.checked })} className="accent-accent" />Funil ativo e disponível para a equipe comercial</label></section>

          <section><div className="mb-3 flex items-center justify-between"><div><h3 className="text-[13px] font-semibold">Etapas do processo</h3><p className="mt-0.5 text-[9px] text-muted-foreground/50">A ordem abaixo será a ordem do Kanban.</p></div><button type="button" onClick={() => setDraft((current) => ({ ...current, etapas: [...current.etapas, newStage()] }))} className="flex h-8 items-center gap-2 rounded-lg border border-accent/25 bg-accent/5 px-3 text-[10px] font-semibold text-accent"><Plus className="h-3.5 w-3.5" />Adicionar etapa</button></div><div className="space-y-3">{draft.etapas.map((stage, index) => <PipelineEtapaEditor key={stage.id || `new-${index}`} etapa={stage} index={index} total={draft.etapas.length} onChange={(updated) => updateStage(index, updated)} onMove={(direction) => moveStage(index, direction)} onRemove={() => removeStage(index)} />)}</div></section>
        </div>

        <footer className="flex justify-end gap-2 border-t border-border/20 px-6 py-4"><button type="button" onClick={onClose} disabled={isProcessing} className="h-9 rounded-lg border border-border/30 px-4 text-[11px]">Cancelar</button><button type="button" onClick={() => onSave({ ...draft, nome: draft.nome.trim(), estrategia: draft.estrategia.trim(), descricao: draft.descricao?.trim() || null })} disabled={!valid || isProcessing} className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[11px] font-semibold text-accent-foreground disabled:opacity-50"><Save className="h-3.5 w-3.5" />{isProcessing ? "Salvando..." : "Salvar funil"}</button></footer>
      </section>
    </div>
  );
};
