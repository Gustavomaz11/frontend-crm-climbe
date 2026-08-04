import { CalendarClock, CheckCircle2, Circle, ListChecks, Pencil, UserRound } from "lucide-react";
import type { PipelineTarefa } from "@/services/usePipelineAtividades";
import { classifyTaskDeadline, formatTaskDate, priorityClasses, taskPriorityLabels, taskStatusLabels } from "./pipelineTaskUtils";

interface PipelineTaskCardProps {
  task: PipelineTarefa;
  showBusiness?: boolean;
  highlighted?: boolean;
  canEdit?: boolean;
  canConclude?: boolean;
  onEdit?: () => void;
  onToggleComplete?: () => void;
  onOpenBusiness?: () => void;
}

export const PipelineTaskCard = ({
  task,
  showBusiness,
  highlighted,
  canEdit,
  canConclude,
  onEdit,
  onToggleComplete,
  onOpenBusiness,
}: PipelineTaskCardProps) => {
  const completedSubtasks = task.subtarefas.filter((item) => item.concluida).length;
  const deadline = classifyTaskDeadline(task);
  const deadlineClasses = {
    OVERDUE: "border-red-500/55 bg-red-500/[0.06]",
    DUE_SOON: "border-amber-500/50 bg-amber-500/[0.05]",
    ON_TRACK: "border-emerald-500/35 bg-emerald-500/[0.035]",
    INACTIVE: "border-border/25 bg-background/35",
  }[deadline.status];
  const deadlineBadgeClasses = {
    OVERDUE: "border-red-500/30 bg-red-500/10 text-red-500",
    DUE_SOON: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    ON_TRACK: "border-emerald-500/25 bg-emerald-500/10 text-emerald-500",
    INACTIVE: "border-border/20 bg-muted/20 text-muted-foreground",
  }[deadline.status];

  return (
    <article className={`rounded-xl border p-3 transition-colors ${highlighted ? "ring-1 ring-accent/55" : ""} ${deadlineClasses}`}>
      <div className="flex items-start gap-3">
        {canConclude && task.status !== "CANCELADA" ? <button type="button" aria-label={task.status === "CONCLUIDA" ? "Reabrir tarefa" : "Concluir tarefa"} onClick={onToggleComplete} className={`mt-0.5 ${task.status === "CONCLUIDA" ? "text-emerald-500" : "text-muted-foreground hover:text-accent"}`}>{task.status === "CONCLUIDA" ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</button> : <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div><h4 className={`text-[12px] font-semibold ${task.status === "CONCLUIDA" ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.titulo}</h4>{showBusiness && <button type="button" onClick={onOpenBusiness} className="mt-0.5 text-[10px] text-accent hover:underline">{task.negocioNome}</button>}</div>
            <div className="flex items-center gap-1.5"><span className={`rounded-full border px-2 py-0.5 text-[8px] font-semibold ${priorityClasses[task.prioridade]}`}>{taskPriorityLabels[task.prioridade]}</span>{canEdit && <button type="button" aria-label="Editar tarefa" onClick={onEdit} className="rounded p-1 text-muted-foreground hover:bg-muted/30 hover:text-foreground"><Pencil className="h-3 w-3" /></button>}</div>
          </div>
          {task.descricao && <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{task.descricao}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground"><span className="flex items-center gap-1"><UserRound className="h-3 w-3" />{task.responsavelNome}</span><span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" />{formatTaskDate(task.prazo)}</span>{deadline.status !== "INACTIVE" && <span className={`rounded-full border px-1.5 py-0.5 font-semibold ${deadlineBadgeClasses}`}>{deadline.label}</span>}<span className="rounded bg-muted/25 px-1.5 py-0.5">{task.tipo}</span><span>{taskStatusLabels[task.status]}</span>{task.subtarefas.length > 0 && <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" />{completedSubtasks}/{task.subtarefas.length}</span>}</div>
        </div>
      </div>
    </article>
  );
};
