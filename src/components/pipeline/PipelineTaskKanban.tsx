import { useMemo, useState, type DragEvent } from "react";
import {
  Ban,
  CheckCircle2,
  CircleDashed,
  Timer,
  type LucideIcon,
} from "lucide-react";
import type {
  PipelineTarefa,
  PipelineTarefaStatus,
} from "@/services/usePipelineAtividades";
import { PipelineTaskCard } from "./PipelineTaskCard";

interface PipelineTaskKanbanProps {
  tasks: PipelineTarefa[];
  highlightedTaskId?: number;
  canEdit: boolean;
  canMove: boolean;
  onEdit: (task: PipelineTarefa) => void;
  onMove: (task: PipelineTarefa, status: PipelineTarefaStatus) => void;
}

interface KanbanColumn {
  status: PipelineTarefaStatus;
  label: string;
  icon: LucideIcon;
  accentClass: string;
}

const kanbanColumns: KanbanColumn[] = [
  { status: "PENDENTE", label: "Pendente", icon: CircleDashed, accentClass: "text-slate-400" },
  { status: "EM_ANDAMENTO", label: "Em andamento", icon: Timer, accentClass: "text-sky-500" },
  { status: "CONCLUIDA", label: "Concluída", icon: CheckCircle2, accentClass: "text-emerald-500" },
  { status: "CANCELADA", label: "Cancelada", icon: Ban, accentClass: "text-red-500" },
];

export const PipelineTaskKanban = ({
  tasks,
  highlightedTaskId,
  canEdit,
  canMove,
  onEdit,
  onMove,
}: PipelineTaskKanbanProps) => {
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<PipelineTarefaStatus | null>(null);
  const tasksById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const tasksByStatus = useMemo(() => {
    const grouped = new Map<PipelineTarefaStatus, PipelineTarefa[]>();
    kanbanColumns.forEach((column) => grouped.set(column.status, []));
    tasks.forEach((task) => grouped.get(task.status)?.push(task));
    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragEvent<HTMLDivElement>, taskId: number) => {
    if (!canMove) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/pipeline-task-id", String(taskId));
    setDraggedTaskId(taskId);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, status: PipelineTarefaStatus) => {
    event.preventDefault();
    const transferredId = Number(event.dataTransfer.getData("text/pipeline-task-id"));
    const taskId = transferredId || draggedTaskId;
    const task = tasksById.get(taskId);

    setDraggedTaskId(null);
    setDragOverStatus(null);
    if (!canMove || !task || task.status === status) return;
    onMove(task, status);
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[920px] grid-cols-4 gap-3">
        {kanbanColumns.map((column) => {
          const Icon = column.icon;
          const columnTasks = tasksByStatus.get(column.status) ?? [];
          const isDragTarget = dragOverStatus === column.status;

          return (
            <section
              key={column.status}
              role="region"
              aria-label={column.label}
              onDragOver={(event) => {
                if (!canMove) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverStatus((current) => current === column.status ? current : column.status);
              }}
              onDragLeave={(event) => {
                const nextTarget = event.relatedTarget;
                if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                  setDragOverStatus(null);
                }
              }}
              onDrop={(event) => handleDrop(event, column.status)}
              className={`flex min-h-72 flex-col rounded-xl border bg-background/25 transition-colors ${
                isDragTarget ? "border-accent/60 bg-accent/5" : "border-border/25"
              }`}
            >
              <header className="flex items-center justify-between border-b border-border/20 px-3 py-2.5">
                <div className={`flex items-center gap-2 ${column.accentClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                  <h4 className="text-[10px] font-semibold uppercase tracking-wide">{column.label}</h4>
                </div>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted/40 px-1.5 text-[9px] font-semibold text-muted-foreground">
                  {columnTasks.length}
                </span>
              </header>

              <div className="flex flex-1 flex-col gap-2 p-2">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    data-testid={`pipeline-task-${task.id}`}
                    draggable={canMove}
                    onDragStart={(event) => handleDragStart(event, task.id)}
                    onDragEnd={() => {
                      setDraggedTaskId(null);
                      setDragOverStatus(null);
                    }}
                    className={canMove ? "cursor-grab active:cursor-grabbing" : undefined}
                  >
                    <PipelineTaskCard
                      task={task}
                      highlighted={task.id === highlightedTaskId}
                      canEdit={canEdit}
                      canConclude={canMove}
                      onEdit={() => onEdit(task)}
                      onToggleComplete={() => onMove(
                        task,
                        task.status === "CONCLUIDA" ? "PENDENTE" : "CONCLUIDA",
                      )}
                    />
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/20 px-3 py-8 text-center text-[9px] text-muted-foreground/40">
                    {canMove ? "Arraste uma tarefa para esta coluna" : "Nenhuma tarefa nesta coluna"}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
