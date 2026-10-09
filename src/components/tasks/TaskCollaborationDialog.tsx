import { X } from "lucide-react";
import type { ReactNode } from "react";
import type { TarefaTipo } from "@/services/useTarefaColaboracao";
import { TaskCollaborationPanel } from "./TaskCollaborationPanel";
import { TaskDialogShell } from "./TaskDialogShell";

export const TaskCollaborationDialog = ({ tipo, taskId, title, onClose, children }: {
  tipo: TarefaTipo; taskId: number; title: string; onClose: () => void; children?: ReactNode;
}) => <TaskDialogShell label="Arquivos e comentários da tarefa" onClose={onClose}>
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/25 p-4"><h2 className="text-sm font-semibold">{title}</h2><button type="button" aria-label="Fechar arquivos e comentários" onClick={onClose}><X className="h-4 w-4" /></button></header>
    <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}<TaskCollaborationPanel tipo={tipo} taskId={taskId} /></div>
</TaskDialogShell>;
