import { useEffect, useState } from "react";
import { CalendarDays, Check, Edit3, Plus, Save, Trash2, X } from "lucide-react";
import type {
  ContratoKanbanSubtarefa,
  ContratoKanbanTask,
  KanbanTaskPrioridade,
  UsuarioResumo,
} from "@/services";
import type { KanbanTaskDraft } from "./KanbanTaskDialog";
import { kanbanPriorityOptions } from "./kanbanPriority";
import { UserSelect } from "@/components/users/UserSelect";

interface KanbanTaskEditDialogProps {
  task: ContratoKanbanTask;
  usuarios: UsuarioResumo[];
  isSaving: boolean;
  subtaskPending: boolean;
  onClose: () => void;
  onSave: (task: ContratoKanbanTask) => Promise<boolean>;
  onCreateSubtask: (taskId: number, titulo: string) => Promise<boolean>;
  onUpdateSubtask: (taskId: number, subtarefa: ContratoKanbanSubtarefa) => Promise<boolean>;
  onToggleSubtask: (taskId: number, subtarefa: ContratoKanbanSubtarefa) => void;
  onDeleteSubtask: (taskId: number, subtarefaId: number) => void;
}

const taskToDraft = (task: ContratoKanbanTask): KanbanTaskDraft => ({
  titulo: task.titulo,
  descricao: task.descricao || "",
  prioridade: task.prioridade,
  responsavelId: task.responsavel?.id ? String(task.responsavel.id) : "",
  dataInicio: task.dataInicio || "",
  dataFim: task.dataFim || "",
});

export const KanbanTaskEditDialog = ({
  task,
  usuarios,
  isSaving,
  subtaskPending,
  onClose,
  onSave,
  onCreateSubtask,
  onUpdateSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: KanbanTaskEditDialogProps) => {
  const [draft, setDraft] = useState(() => taskToDraft(task));
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const completedSubtasks = task.subtarefas.filter((subtarefa) => subtarefa.concluida).length;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSaving, onClose]);

  const saveTask = async () => {
    const titulo = draft.titulo.trim();
    if (!titulo) return;

    const saved = await onSave({
      ...task,
      titulo,
      descricao: draft.descricao.trim(),
      prioridade: draft.prioridade,
      responsavel: usuarios.find((usuario) => usuario.id === Number(draft.responsavelId)) || null,
      dataInicio: draft.dataInicio || null,
      dataFim: draft.dataFim || null,
    });
    if (saved) onClose();
  };

  const createSubtask = async () => {
    const titulo = newSubtaskTitle.trim();
    if (!titulo) return;
    const created = await onCreateSubtask(task.id, titulo);
    if (created) setNewSubtaskTitle("");
  };

  const saveSubtask = async (subtarefa: ContratoKanbanSubtarefa) => {
    const titulo = editingSubtaskTitle.trim();
    if (!titulo) return;
    const saved = await onUpdateSubtask(task.id, { ...subtarefa, titulo });
    if (saved) setEditingSubtaskId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="edit-task-title">
      <button type="button" aria-label="Fechar edição" className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/30 bg-card/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/20 p-5">
          <div>
            <h2 id="edit-task-title" className="text-[16px] font-semibold text-foreground">Editar tarefa</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground/50">Atualize os detalhes e organize as subtarefas</p>
          </div>
          <button type="button" aria-label="Fechar modal" onClick={onClose} disabled={isSaving} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="min-h-0 flex-1 overflow-y-auto p-5" onSubmit={(event) => { event.preventDefault(); void saveTask(); }}>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground/40">Título</span>
              <input autoFocus required value={draft.titulo} onChange={(event) => setDraft({ ...draft, titulo: event.target.value })} className="h-9 w-full rounded-lg border border-border/25 bg-background/60 px-3 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40" />
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground/40">Descrição</span>
              <textarea value={draft.descricao} onChange={(event) => setDraft({ ...draft, descricao: event.target.value })} placeholder="Detalhes, contexto e resultado esperado" className="min-h-[96px] w-full resize-y rounded-lg border border-border/25 bg-background/60 px-3 py-2 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40" />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground/40">Prioridade</span>
                <select value={draft.prioridade} onChange={(event) => setDraft({ ...draft, prioridade: event.target.value as KanbanTaskPrioridade })} className="h-9 w-full rounded-lg border border-border/25 bg-background/60 px-3 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40">
                  {kanbanPriorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <div>
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground/40">Responsável</span>
                <UserSelect
                  users={usuarios}
                  value={draft.responsavelId}
                  onValueChange={(responsavelId) => setDraft({ ...draft, responsavelId })}
                  placeholder="Sem responsável"
                  emptyLabel="Sem responsável"
                  ariaLabel="Responsável"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground/40">Início</span>
                <span className="relative block">
                  <CalendarDays className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground/35" />
                  <input type="date" value={draft.dataInicio} onChange={(event) => setDraft({ ...draft, dataInicio: event.target.value })} className="h-9 w-full rounded-lg border border-border/25 bg-background/60 pl-8 pr-2 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40" />
                </span>
              </label>
              <label>
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground/40">Fim</span>
                <input type="date" value={draft.dataFim} onChange={(event) => setDraft({ ...draft, dataFim: event.target.value })} className="h-9 w-full rounded-lg border border-border/25 bg-background/60 px-3 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40" />
              </label>
            </div>
          </div>

          <section className="mt-5 rounded-xl border border-border/20 bg-background/35 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/65">Subtarefas</h3>
                <p className="mt-0.5 text-[10px] text-muted-foreground/40">{completedSubtasks} de {task.subtarefas.length} concluídas</p>
              </div>
              <span className="rounded-md bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent">{completedSubtasks}/{task.subtarefas.length}</span>
            </div>

            <div className="space-y-2">
              {task.subtarefas.length === 0 && <p className="rounded-lg border border-dashed border-border/20 py-4 text-center text-[11px] text-muted-foreground/35">Nenhuma subtarefa criada</p>}
              {task.subtarefas.map((subtarefa) => (
                <div key={subtarefa.id} className="flex items-center gap-2 rounded-lg border border-border/15 bg-card/40 px-2.5 py-2">
                  <button type="button" disabled={subtaskPending} onClick={() => onToggleSubtask(task.id, subtarefa)} className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${subtarefa.concluida ? "border-accent bg-accent text-accent-foreground" : "border-border/50 text-transparent"}`}>
                    <Check className="h-3 w-3" />
                  </button>
                  {editingSubtaskId === subtarefa.id ? (
                    <input autoFocus value={editingSubtaskTitle} onChange={(event) => setEditingSubtaskTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void saveSubtask(subtarefa); } }} className="h-7 min-w-0 flex-1 rounded border border-border/25 bg-background px-2 text-[11px] outline-none focus:border-accent/40" />
                  ) : (
                    <span className={`min-w-0 flex-1 text-[11px] ${subtarefa.concluida ? "text-muted-foreground/40 line-through" : "text-foreground/70"}`}>{subtarefa.titulo}</span>
                  )}
                  {editingSubtaskId === subtarefa.id ? (
                    <button type="button" title="Salvar subtarefa" disabled={subtaskPending} onClick={() => void saveSubtask(subtarefa)} className="text-accent disabled:opacity-40"><Save className="h-3.5 w-3.5" /></button>
                  ) : (
                    <button type="button" title="Editar subtarefa" onClick={() => { setEditingSubtaskId(subtarefa.id); setEditingSubtaskTitle(subtarefa.titulo); }} className="text-muted-foreground/35 hover:text-accent"><Edit3 className="h-3.5 w-3.5" /></button>
                  )}
                  <button type="button" title="Remover subtarefa" disabled={subtaskPending} onClick={() => onDeleteSubtask(task.id, subtarefa.id)} className="text-muted-foreground/35 hover:text-destructive disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <input value={newSubtaskTitle} onChange={(event) => setNewSubtaskTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void createSubtask(); } }} placeholder="Nova subtarefa" className="h-8 min-w-0 flex-1 rounded-lg border border-border/25 bg-background/60 px-3 text-[11px] outline-none focus:border-accent/40" />
                <button type="button" disabled={subtaskPending || !newSubtaskTitle.trim()} onClick={() => void createSubtask()} className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[11px] font-semibold text-accent-foreground disabled:opacity-40">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </div>
            </div>
          </section>

          <div className="sticky bottom-0 mt-5 flex justify-end gap-2 border-t border-border/15 bg-card/95 pt-4">
            <button type="button" onClick={onClose} disabled={isSaving} className="h-9 rounded-lg border border-border/30 px-4 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40">Cancelar</button>
            <button type="submit" disabled={isSaving || !draft.titulo.trim()} className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[12px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">
              <Save className="h-3.5 w-3.5" /> {isSaving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
