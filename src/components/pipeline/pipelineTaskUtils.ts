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

export const isOpenTask = (task: PipelineTarefa) => !["CONCLUIDA", "CANCELADA"].includes(task.status);

export const findNextTask = (tasks: PipelineTarefa[]) => tasks
  .filter(isOpenTask)
  .sort((first, second) => {
    const firstDate = first.prazo || first.dataInicio || "9999-12-31";
    const secondDate = second.prazo || second.dataInicio || "9999-12-31";
    return firstDate.localeCompare(secondDate);
  })[0];
