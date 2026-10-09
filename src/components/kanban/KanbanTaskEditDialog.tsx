import { useEffect, useId, useState } from "react";
import { Save, X } from "lucide-react";
import { FormValidation } from "@/components/ui/form-validation";
import { UserMultiSelect } from "@/components/users/UserMultiSelect";
import { TaskCollaborationPanel } from "@/components/tasks/TaskCollaborationPanel";
import { TaskDialogShell } from "@/components/tasks/TaskDialogShell";
import type { ContratoKanbanTask, KanbanTaskPrioridade, UsuarioResumo } from "@/services/useContratoKanban";
import { KanbanSubtasks, type KanbanSubtasksProps } from "./KanbanSubtasks";
import type { KanbanTaskDraft } from "./KanbanTaskDialog";
import { kanbanPriorityOptions } from "./kanbanPriority";

interface Props extends KanbanSubtasksProps {
  contratoId?: number;
  usuarios: UsuarioResumo[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (task: ContratoKanbanTask) => Promise<boolean>;
}
const inputClass = "mt-1 h-9 w-full rounded-lg border border-border/30 bg-background/60 px-3 text-[12px] outline-none focus:border-accent/40";
const taskToDraft = (task: ContratoKanbanTask): KanbanTaskDraft => ({
  titulo: task.titulo, descricao: task.descricao || "", prioridade: task.prioridade,
  responsavelId: task.responsavel?.id ? String(task.responsavel.id) : "",
  responsavelIds: (task.responsaveis ?? (task.responsavel ? [task.responsavel] : [])).map((user) => user.id),
  dataInicio: task.dataInicio || "", dataFim: task.dataFim || "",
});

export const KanbanTaskEditDialog = (props: Props) => {
  const { task, contratoId, usuarios, canEdit = true, isSaving, onClose, onSave } = props;
  const formId = useId();
  const [draft, setDraft] = useState(() => taskToDraft(task));
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !isSaving) onClose(); };
    window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close);
  }, [isSaving, onClose]);
  const save = async () => {
    if (!canEdit) return;
    const responsaveis = usuarios.filter((user) => draft.responsavelIds?.includes(user.id));
    if (await onSave({ ...task, titulo: draft.titulo.trim(), descricao: draft.descricao.trim(), prioridade: draft.prioridade,
      responsaveis, responsavel: responsaveis[0] || null, dataInicio: draft.dataInicio || null, dataFim: draft.dataFim || null })) onClose();
  };
  return <TaskDialogShell labelledBy="edit-task-title" onClose={onClose} closeDisabled={isSaving}>
      <header className="flex shrink-0 items-center justify-between border-b border-border/25 p-5"><div><h2 id="edit-task-title" className="text-[16px] font-semibold">{canEdit ? "Editar tarefa" : task.titulo}</h2><p className="mt-1 text-[11px] text-muted-foreground">Detalhes, subtarefas, arquivos e comentários.</p></div><button type="button" aria-label="Fechar modal" disabled={isSaving} onClick={onClose}><X className="h-4 w-4" /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
          <FormValidation as="form" id={formId} aria-label="Dados da tarefa" className="min-w-0" onSubmit={(event) => { event.preventDefault(); void save(); }}>
            <fieldset disabled={!canEdit || isSaving} className="space-y-3">
              <label className="block text-[10px]">Título *<input required autoFocus value={draft.titulo} onChange={(event) => setDraft({ ...draft, titulo: event.target.value })} className={inputClass} /></label>
              <label className="block text-[10px]">Descrição<textarea value={draft.descricao} onChange={(event) => setDraft({ ...draft, descricao: event.target.value })} className="mt-1 min-h-24 w-full rounded-lg border border-border/30 bg-background/60 px-3 py-2 text-[12px]" /></label>
              <label className="block text-[10px]">Prioridade *<select required value={draft.prioridade} onChange={(event) => setDraft({ ...draft, prioridade: event.target.value as KanbanTaskPrioridade })} className={inputClass}>{kanbanPriorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <UserMultiSelect users={usuarios} value={draft.responsavelIds || []} disabled={!canEdit || isSaving} onChange={(responsavelIds) => setDraft({ ...draft, responsavelIds, responsavelId: String(responsavelIds[0] || "") })} />
              {canEdit && <p className="text-[10px] text-muted-foreground">Ao remover uma pessoa da tarefa, suas subtarefas ficam sem responsável.</p>}
              <div className="grid gap-3 sm:grid-cols-2"><label className="text-[10px]">Início<input type="date" value={draft.dataInicio} onChange={(event) => setDraft({ ...draft, dataInicio: event.target.value })} className={inputClass} /></label><label className="text-[10px]">Fim<input type="date" min={draft.dataInicio || undefined} value={draft.dataFim} onChange={(event) => setDraft({ ...draft, dataFim: event.target.value })} className={inputClass} /></label></div>
            </fieldset>
          </FormValidation>
          <div className="min-w-0 [&>section:first-child]:mt-0">
            <KanbanSubtasks {...props} />
            {contratoId && <TaskCollaborationPanel tipo="CONTRATO" taskId={task.id} />}
          </div>
        </div>
      </div>
      <footer className="flex shrink-0 justify-end gap-2 border-t border-border/25 p-4">
        <button type="button" onClick={onClose} disabled={isSaving} className="rounded-lg border border-border/30 px-4 py-2 text-[12px]">Fechar</button>
        {canEdit && <button type="submit" form={formId} disabled={isSaving} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-accent-foreground disabled:opacity-50"><Save className="h-3.5 w-3.5" />{isSaving ? "Salvando..." : "Salvar alterações"}</button>}
      </footer>
  </TaskDialogShell>;
};
