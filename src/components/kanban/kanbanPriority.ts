import type { KanbanTaskPrioridade } from "@/services";

export const kanbanPriorityOptions: { value: KanbanTaskPrioridade; label: string }[] = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Média" },
  { value: "ALTA", label: "Alta" },
];

export const kanbanPriorityLabel = (prioridade: KanbanTaskPrioridade) =>
  kanbanPriorityOptions.find((option) => option.value === prioridade)?.label ?? prioridade;
