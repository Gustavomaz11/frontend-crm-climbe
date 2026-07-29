import type { KanbanTaskPrioridade } from "@/services";
import { kanbanPriorityLabel } from "./kanbanPriority";

const PRIORITY_STYLES: Record<KanbanTaskPrioridade, string> = {
  BAIXA: "border-sky-500/20 bg-sky-500/10 text-sky-500",
  MEDIA: "border-amber-500/20 bg-amber-500/10 text-amber-500",
  ALTA: "border-destructive/20 bg-destructive/10 text-destructive",
};

interface KanbanPriorityBadgeProps {
  prioridade: KanbanTaskPrioridade;
}

export const KanbanPriorityBadge = ({ prioridade }: KanbanPriorityBadgeProps) => (
  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[prioridade]}`}>
    {kanbanPriorityLabel(prioridade)}
  </span>
);
