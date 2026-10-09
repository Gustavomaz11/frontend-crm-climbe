import { useState } from "react";
import { Check, Edit3, Plus, Save, Trash2 } from "lucide-react";
import { FormValidation } from "@/components/ui/form-validation";
import { UserSelect } from "@/components/users/UserSelect";
import type { ContratoKanbanTask, ContratoKanbanSubtarefa } from "@/services/useContratoKanban";

export interface KanbanSubtasksProps {
  task: ContratoKanbanTask;
  canEdit?: boolean;
  canToggle?: boolean;
  subtaskPending: boolean;
  onCreateSubtask: (taskId: number, titulo: string, responsavelId?: number | null) => Promise<boolean>;
  onUpdateSubtask: (taskId: number, subtarefa: ContratoKanbanSubtarefa) => Promise<boolean>;
  onToggleSubtask: (taskId: number, subtarefa: ContratoKanbanSubtarefa) => void;
  onDeleteSubtask: (taskId: number, subtarefaId: number) => void;
}

export const KanbanSubtasks = ({ task, canEdit = true, canToggle = true, subtaskPending, onCreateSubtask, onUpdateSubtask, onToggleSubtask, onDeleteSubtask }: KanbanSubtasksProps) => {
  const [newTitle, setNewTitle] = useState("");
  const [newResponsible, setNewResponsible] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const responsibles = task.responsaveis ?? (task.responsavel ? [task.responsavel] : []);
  const create = async () => {
    if (await onCreateSubtask(task.id, newTitle.trim(), Number(newResponsible) || null)) { setNewTitle(""); setNewResponsible(""); }
  };
  const save = async (subtask: ContratoKanbanSubtarefa) => {
    if (await onUpdateSubtask(task.id, { ...subtask, titulo: title.trim() })) setEditing(null);
  };
  return <section className="mt-5 space-y-3 rounded-xl border border-border/25 bg-background/30 p-3" aria-label="Subtarefas">
    <h3 className="text-[12px] font-semibold">Subtarefas · {task.subtarefas.filter((item) => item.concluida).length}/{task.subtarefas.length} concluídas</h3>
    <p className="text-[10px] text-muted-foreground">Cada subtarefa pode ser atribuída a uma das pessoas responsáveis pela tarefa.</p>
    {task.subtarefas.map((subtask) => <FormValidation key={subtask.id} className="space-y-2 rounded-lg border border-border/20 p-2.5">
      <div className="flex items-center gap-2"><button type="button" aria-label={`${subtask.concluida ? "Reabrir" : "Concluir"} subtarefa ${subtask.titulo}`} disabled={!canToggle || subtaskPending} onClick={() => onToggleSubtask(task.id, subtask)} className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${subtask.concluida ? "border-accent bg-accent text-accent-foreground" : "border-border/50"}`}>
        {subtask.concluida && <Check className="h-3 w-3" />}</button>
        {editing === subtask.id ? <label className="min-w-0 flex-1 text-[10px]">Título da subtarefa *<input required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded border border-border/25 bg-background px-2 py-1 text-[11px]" /></label>
          : <p className={`min-w-0 flex-1 text-[11px] ${subtask.concluida ? "text-muted-foreground line-through" : ""}`}>{subtask.titulo}</p>}
        {canEdit && <>{editing === subtask.id ? <button type="button" data-validate-submit aria-label="Salvar subtarefa" disabled={subtaskPending} onClick={() => void save(subtask)}><Save className="h-3.5 w-3.5 text-accent" /></button>
          : <button type="button" aria-label={`Editar subtarefa ${subtask.titulo}`} onClick={() => { setEditing(subtask.id); setTitle(subtask.titulo); }}><Edit3 className="h-3.5 w-3.5 text-muted-foreground" /></button>}
          <button type="button" aria-label={`Remover subtarefa ${subtask.titulo}`} disabled={subtaskPending} onClick={() => onDeleteSubtask(task.id, subtask.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></button></>}
      </div>
      {canEdit ? <UserSelect users={responsibles} value={subtask.responsavel?.id} ariaLabel={`Responsável da subtarefa ${subtask.titulo}`} disabled={subtaskPending}
        onValueChange={(id) => void onUpdateSubtask(task.id, { ...subtask, responsavel: responsibles.find((person) => person.id === Number(id)) || null })} />
        : <p className="text-[10px] text-muted-foreground">{subtask.responsavel?.nomeCompleto || "Sem responsável"}</p>}
    </FormValidation>)}
    {!task.subtarefas.length && <p className="text-[11px] text-muted-foreground">Nenhuma subtarefa criada.</p>}
    {canEdit && <FormValidation className="space-y-2 rounded-lg border border-dashed border-border/30 p-2.5">
      <label className="block text-[10px]">Nova subtarefa *<input required value={newTitle} onChange={(event) => setNewTitle(event.target.value)} className="mt-1 h-8 w-full rounded border border-border/30 bg-background px-2 text-[11px]" /></label>
      <UserSelect users={responsibles} value={newResponsible} onValueChange={setNewResponsible} ariaLabel="Responsável da nova subtarefa" />
      <button type="button" data-validate-submit disabled={subtaskPending} onClick={() => void create()} className="flex items-center gap-2 rounded bg-accent px-3 py-2 text-[11px] font-semibold text-accent-foreground"><Plus className="h-3.5 w-3.5" />Adicionar subtarefa</button>
    </FormValidation>}
  </section>;
};
