import type { PipelineTarefa, PipelineTarefaPrioridade, PipelineTarefaStatus } from "@/services/usePipelineAtividades";

export const taskStatusLabels: Record<PipelineTarefaStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export const taskPriorityLabels: Record<PipelineTarefaPrioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const priorityClasses: Record<PipelineTarefaPrioridade, string> = {
  BAIXA: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  MEDIA: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ALTA: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  URGENTE: "bg-red-500/10 text-red-500 border-red-500/20",
};

export const formatTaskDate = (value?: string | null) => {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
};

export const isOpenTask = (task: Pick<PipelineTarefa, "status">) => !["CONCLUIDA", "CANCELADA"].includes(task.status);

export type TaskDeadlineStatus = "OVERDUE" | "DUE_SOON" | "ON_TRACK" | "INACTIVE";

export interface TaskDeadlineClassification {
  status: TaskDeadlineStatus;
  daysRemaining: number | null;
  label: string;
}

const toLocalCalendarDay = (date: Date) => Date.UTC(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
) / 86_400_000;

export const classifyTaskDeadline = (
  task: Pick<PipelineTarefa, "prazo" | "status">,
  today = new Date(),
): TaskDeadlineClassification => {
  if (!isOpenTask(task) || !task.prazo) {
    return { status: "INACTIVE", daysRemaining: null, label: "Prazo encerrado" };
  }

  const deadline = new Date(`${task.prazo}T00:00:00`);
  const daysRemaining = toLocalCalendarDay(deadline) - toLocalCalendarDay(today);
  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return {
      status: "OVERDUE",
      daysRemaining,
      label: `Atrasada há ${overdueDays} ${overdueDays === 1 ? "dia" : "dias"}`,
    };
  }
  if (daysRemaining <= 5) {
    return {
      status: "DUE_SOON",
      daysRemaining,
      label: daysRemaining === 0 ? "Vence hoje" : `Vence em ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}`,
    };
  }
  return { status: "ON_TRACK", daysRemaining, label: "Prazo em dia" };
};

export const findNextTask = (tasks: PipelineTarefa[]) => tasks
  .filter(isOpenTask)
  .sort((first, second) => {
    const firstDate = first.prazo || first.dataInicio || "9999-12-31";
    const secondDate = second.prazo || second.dataInicio || "9999-12-31";
    return firstDate.localeCompare(secondDate);
  })[0];
