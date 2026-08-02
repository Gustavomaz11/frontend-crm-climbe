import { useMemo, useState } from "react";
import { Check, Plus, Save, Trash2, X } from "lucide-react";
import type { PipelineTarefa, PipelineTarefaInput } from "@/services/usePipelineAtividades";
import type { Usuario } from "@/services/useUsuarios";
import { UserSelect } from "@/components/users/UserSelect";

interface PipelineTarefaDialogProps {
  tarefa?: PipelineTarefa | null;
  usuarios: Usuario[];
  defaultResponsavelId: number;
  isProcessing: boolean;
  onClose: () => void;
  onSave: (input: PipelineTarefaInput) => void;
}

const inputClass = "h-9 w-full rounded-lg border border-border/30 bg-background px-3 text-[11px] outline-none focus:border-accent/45";
const textAreaClass = "w-full rounded-lg border border-border/30 bg-background px-3 py-2 text-[11px] outline-none focus:border-accent/45";

export const PipelineTarefaDialog = ({
  tarefa,
  usuarios,
  defaultResponsavelId,
  isProcessing,
  onClose,
  onSave,
}: PipelineTarefaDialogProps) => {
  const initialDraft = useMemo<PipelineTarefaInput>(() => ({
    titulo: tarefa?.titulo || "",
    descricao: tarefa?.descricao || "",
    responsavelId: tarefa?.responsavelId || defaultResponsavelId,
    dataInicio: tarefa?.dataInicio || "",
    prazo: tarefa?.prazo || "",
    prioridade: tarefa?.prioridade || "MEDIA",
    status: tarefa?.status || "PENDENTE",
    tipo: tarefa?.tipo || "Follow-up",
    observacoes: tarefa?.observacoes || "",
    subtarefas: (tarefa?.subtarefas || []).map(({ titulo, concluida, posicao }) => ({ titulo, concluida, posicao })),
  }), [defaultResponsavelId, tarefa]);
  const [draft, setDraft] = useState(initialDraft);
  const [newSubtask, setNewSubtask] = useState("");

  const addSubtask = () => {
    const title = newSubtask.trim();
    if (!title) return;
    setDraft((current) => ({
      ...current,
      subtarefas: [...current.subtarefas, { titulo: title, concluida: false, posicao: current.subtarefas.length }],
    }));
    setNewSubtask("");
  };

  const valid = draft.titulo.trim() && draft.tipo.trim() && draft.responsavelId
    && (!draft.dataInicio || !draft.prazo || draft.prazo >= draft.dataInicio);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-label={tarefa ? "Editar tarefa" : "Nova tarefa"} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/30 bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border/20 px-5 py-4">
          <div><h3 className="text-sm font-semibold">{tarefa ? "Editar tarefa" : "Nova tarefa"}</h3><p className="mt-0.5 text-[10px] text-muted-foreground/55">Organize a próxima ação desta negociação.</p></div>
          <button type="button" onClick={onClose} disabled={isProcessing} className="rounded-lg p-2 hover:bg-muted/30"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-4 overflow-y-auto p-5">
          <label className="block text-[10px] font-medium">Título *<input className={`${inputClass} mt-1`} value={draft.titulo} onChange={(event) => setDraft({ ...draft, titulo: event.target.value })} placeholder="Ex.: Enviar proposta revisada" /></label>
          <label className="block text-[10px] font-medium">Descrição<textarea className={`${textAreaClass} mt-1 min-h-20`} value={draft.descricao || ""} onChange={(event) => setDraft({ ...draft, descricao: event.target.value })} /></label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="text-[10px] font-medium">Responsável *<UserSelect className="mt-1" users={usuarios.filter((usuario) => !usuario.situacao || usuario.situacao === "ATIVO")} value={draft.responsavelId || ""} onValueChange={(next) => setDraft({ ...draft, responsavelId: Number(next) || 0 })} placeholder="Selecione" emptyLabel="Selecione" ariaLabel="Responsável *" /></div>
            <label className="text-[10px] font-medium">Tipo *<input className={`${inputClass} mt-1`} list="pipeline-task-types" value={draft.tipo} onChange={(event) => setDraft({ ...draft, tipo: event.target.value })} /><datalist id="pipeline-task-types"><option value="Follow-up" /><option value="Ligação" /><option value="Reunião" /><option value="E-mail" /><option value="Proposta" /><option value="Documentação" /></datalist></label>
            <label className="text-[10px] font-medium">Data de início<input type="date" className={`${inputClass} mt-1`} value={draft.dataInicio || ""} onChange={(event) => setDraft({ ...draft, dataInicio: event.target.value })} /></label>
            <label className="text-[10px] font-medium">Prazo<input type="date" className={`${inputClass} mt-1`} value={draft.prazo || ""} onChange={(event) => setDraft({ ...draft, prazo: event.target.value })} /></label>
            <label className="text-[10px] font-medium">Prioridade *<select className={`${inputClass} mt-1`} value={draft.prioridade} onChange={(event) => setDraft({ ...draft, prioridade: event.target.value as PipelineTarefaInput["prioridade"] })}><option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option></select></label>
            <label className="text-[10px] font-medium">Status *<select className={`${inputClass} mt-1`} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as PipelineTarefaInput["status"] })}><option value="PENDENTE">Pendente</option><option value="EM_ANDAMENTO">Em andamento</option><option value="CONCLUIDA">Concluída</option><option value="CANCELADA">Cancelada</option></select></label>
          </div>

          <div>
            <p className="text-[10px] font-medium">Subtarefas</p>
            <div className="mt-2 space-y-2">{draft.subtarefas.map((subtask, index) => <div key={`${subtask.titulo}-${index}`} className="flex items-center gap-2 rounded-lg border border-border/20 bg-background/45 px-3 py-2"><button type="button" onClick={() => setDraft((current) => ({ ...current, subtarefas: current.subtarefas.map((item, itemIndex) => itemIndex === index ? { ...item, concluida: !item.concluida } : item) }))} className={`flex h-4 w-4 items-center justify-center rounded border ${subtask.concluida ? "border-accent bg-accent text-accent-foreground" : "border-border/50"}`}>{subtask.concluida && <Check className="h-3 w-3" />}</button><input value={subtask.titulo} onChange={(event) => setDraft((current) => ({ ...current, subtarefas: current.subtarefas.map((item, itemIndex) => itemIndex === index ? { ...item, titulo: event.target.value } : item) }))} className="flex-1 bg-transparent text-[11px] outline-none" /><button type="button" onClick={() => setDraft((current) => ({ ...current, subtarefas: current.subtarefas.filter((_, itemIndex) => itemIndex !== index) }))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>
            <div className="mt-2 flex gap-2"><input className={inputClass} value={newSubtask} onChange={(event) => setNewSubtask(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSubtask(); } }} placeholder="Adicionar subtarefa" /><button type="button" onClick={addSubtask} className="flex h-9 w-10 items-center justify-center rounded-lg border border-border/30 hover:border-accent/40 hover:text-accent"><Plus className="h-4 w-4" /></button></div>
          </div>

          <label className="block text-[10px] font-medium">Observações<textarea className={`${textAreaClass} mt-1 min-h-16`} value={draft.observacoes || ""} onChange={(event) => setDraft({ ...draft, observacoes: event.target.value })} /></label>
          {draft.dataInicio && draft.prazo && draft.prazo < draft.dataInicio && <p className="text-[10px] text-destructive">O prazo não pode ser anterior à data de início.</p>}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border/20 px-5 py-4"><button type="button" onClick={onClose} disabled={isProcessing} className="h-9 rounded-lg border border-border/30 px-4 text-[11px]">Cancelar</button><button type="button" onClick={() => onSave({ ...draft, titulo: draft.titulo.trim(), tipo: draft.tipo.trim(), subtarefas: draft.subtarefas.filter((item) => item.titulo.trim()).map((item, index) => ({ ...item, titulo: item.titulo.trim(), posicao: index })) })} disabled={!valid || isProcessing} className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[11px] font-semibold text-accent-foreground disabled:opacity-50"><Save className="h-3.5 w-3.5" />{isProcessing ? "Salvando..." : "Salvar tarefa"}</button></footer>
      </section>
    </div>
  );
};
