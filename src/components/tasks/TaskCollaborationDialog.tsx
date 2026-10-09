import { X } from "lucide-react";
import type { ReactNode } from "react";
import type { TarefaTipo } from "@/services/useTarefaColaboracao";
import { TaskCollaborationPanel } from "./TaskCollaborationPanel";

export const TaskCollaborationDialog = ({ tipo, taskId, title, onClose, children }: {
  tipo: TarefaTipo; taskId: number; title: string; onClose: () => void; children?: ReactNode;
}) => <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Arquivos e comentários da tarefa">
  <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/30 bg-card shadow-2xl">
    <header className="flex items-center justify-between gap-3 border-b border-border/25 p-4"><h2 className="text-sm font-semibold">{title}</h2><button type="button" aria-label="Fechar arquivos e comentários" onClick={onClose}><X className="h-4 w-4" /></button></header>
    <div className="min-h-0 overflow-y-auto p-4">{children}<TaskCollaborationPanel tipo={tipo} taskId={taskId} /></div>
  </div>
</div>;
