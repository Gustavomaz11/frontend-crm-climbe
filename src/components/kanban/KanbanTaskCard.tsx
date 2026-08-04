import {
  Check,
  CheckSquare2,
  Clock3,
  Edit3,
  GripVertical,
  Trash2,
  UserRound,
} from "lucide-react";
import type { ContratoKanbanSubtarefa, ContratoKanbanTask } from "@/services";
import { KanbanPriorityBadge } from "./KanbanPriorityBadge";

interface KanbanTaskCardProps {
  task: ContratoKanbanTask;
  gestor: boolean;
  usuarioId: number | null;
  isDragging: boolean;
  movePending: boolean;
  subtaskPending: boolean;
  onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onEdit: (task: ContratoKanbanTask) => void;
  onDelete: (taskId: number) => void;
  onToggleSubtask: (taskId: number, subtarefa: ContratoKanbanSubtarefa) => void;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return dateFormatter.format(new Date(`${value}T00:00:00`));
};

export const KanbanTaskCard = ({
  task,
  gestor,
  usuarioId,
  isDragging,
  movePending,
  subtaskPending,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
  onToggleSubtask,
}: KanbanTaskCardProps) => {
  const canMoveTask = gestor || task.responsavel?.id === usuarioId;
  const completedSubtasks = task.subtarefas.filter((subtarefa) => subtarefa.concluida).length;

  return (
    <div
      draggable={canMoveTask && !movePending}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group rounded-lg border border-border/20 bg-background/60 p-3 transition-all ${canMoveTask ? "cursor-grab active:cursor-grabbing hover:border-accent/25 hover:shadow-[0_8px_18px_-12px_hsl(var(--accent)/0.45)]" : ""} ${isDragging ? "opacity-45 ring-1 ring-accent/30" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground/85">{task.titulo}</p>
        <div className="flex shrink-0 items-center gap-1">
          {gestor && (
            <button
              type="button"
              title="Editar tarefa"
              aria-label={`Editar tarefa ${task.titulo}`}
              onClick={() => onEdit(task)}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent/10 hover:text-accent"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          )}
          {canMoveTask && <GripVertical className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-muted-foreground" />}
        </div>
      </div>

      <div className="mt-2"><KanbanPriorityBadge prioridade={task.prioridade} /></div>
      {task.descricao && <p className="mt-2 line-clamp-3 text-[11px] text-muted-foreground">{task.descricao}</p>}

      {task.subtarefas.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-border/15 pt-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><CheckSquare2 className="h-3 w-3" /> Subtarefas</span>
            <span>{completedSubtasks}/{task.subtarefas.length}</span>
          </div>
          {task.subtarefas.slice(0, 3).map((subtarefa) => (
            <button
              type="button"
              disabled={!canMoveTask || subtaskPending}
              key={subtarefa.id}
              onClick={() => onToggleSubtask(task.id, subtarefa)}
              className="flex w-full items-center gap-2 text-left disabled:cursor-default"
            >
              <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${subtarefa.concluida ? "border-accent bg-accent text-accent-foreground" : "border-border/50 text-transparent"}`}>
                <Check className="h-2.5 w-2.5" />
              </span>
              <span className={`truncate text-[10px] ${subtarefa.concluida ? "text-muted-foreground line-through" : "text-foreground"}`}>{subtarefa.titulo}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5"><UserRound className="h-3 w-3" /> {task.responsavel?.nomeCompleto || "Sem responsável"}</div>
        <div className="flex items-center gap-1.5"><Clock3 className="h-3 w-3" /> {formatDate(task.dataInicio)} até {formatDate(task.dataFim)}</div>
      </div>

      {gestor && (
        <button type="button" title="Remover tarefa" onClick={() => onDelete(task.id)} className="mt-3 flex h-7 items-center gap-1.5 rounded-md border border-destructive/15 px-2 text-[10px] font-semibold text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3 w-3" /> Remover
        </button>
      )}
    </div>
  );
};
