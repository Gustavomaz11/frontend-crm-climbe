import { useState } from "react";
import { ArrowRight, ListTodo, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useCreatePipelineTarefa,
  useNegocioTarefas,
  useSetPipelineTarefaStatus,
  useUpdatePipelineTarefa,
  type PipelineTarefa,
  type PipelineTarefaInput,
  type PipelineTarefaStatus,
} from "@/services/usePipelineAtividades";
import type { Usuario } from "@/services/useUsuarios";
import { findNextTask, formatTaskDate, taskStatusLabels } from "./pipelineTaskUtils";
import { PipelineTarefaDialog } from "./PipelineTarefaDialog";
import { PipelineTaskKanban } from "./PipelineTaskKanban";

interface PipelineTarefasPanelProps {
  negocioId: number;
  responsavelId: number;
  initialTaskId?: number;
  usuarios: Usuario[];
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canConclude: boolean;
}

export const PipelineTarefasPanel = ({
  negocioId,
  responsavelId,
  initialTaskId,
  usuarios,
  canView,
  canCreate,
  canEdit,
  canConclude,
}: PipelineTarefasPanelProps) => {
  const [editingTask, setEditingTask] = useState<PipelineTarefa | null | undefined>(undefined);
  const [statusOverrides, setStatusOverrides] = useState<Record<number, PipelineTarefaStatus>>({});
  const { data: tasks = [], isLoading } = useNegocioTarefas(negocioId, canView);
  const createTask = useCreatePipelineTarefa();
  const updateTask = useUpdatePipelineTarefa();
  const setStatus = useSetPipelineTarefaStatus();
  const displayedTasks = tasks.map((task) => ({
    ...task,
    status: statusOverrides[task.id] || task.status,
  }));
  const nextTask = findNextTask(displayedTasks);
  const processing = createTask.isPending || updateTask.isPending;

  const saveTask = async (input: PipelineTarefaInput) => {
    try {
      if (editingTask) await updateTask.mutateAsync({ tarefaId: editingTask.id, data: input });
      else await createTask.mutateAsync({ negocioId, data: input });
      toast.success(editingTask ? "Tarefa atualizada" : "Tarefa criada");
      setEditingTask(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar tarefa");
    }
  };

  const moveTask = async (task: PipelineTarefa, status: PipelineTarefaStatus) => {
    if (task.status === status) return;
    setStatusOverrides((current) => ({ ...current, [task.id]: status }));

    try {
      await setStatus.mutateAsync({ tarefaId: task.id, status });
      toast.success(`Tarefa movida para ${taskStatusLabels[status].toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao alterar a tarefa");
    } finally {
      setStatusOverrides((current) => {
        const next = { ...current };
        delete next[task.id];
        return next;
      });
    }
  };

  if (!canView) return <div className="rounded-xl border border-border/25 bg-muted/10 p-8 text-center text-[11px] text-muted-foreground">Você não possui permissão para visualizar as tarefas comerciais.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h3 className="text-[13px] font-semibold">Atividades da negociação</h3><p className="mt-0.5 text-[10px] text-muted-foreground">Prazos, responsáveis e subtarefas em um só lugar.</p></div>{canCreate && <button type="button" onClick={() => setEditingTask(null)} className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-[11px] font-semibold text-accent-foreground"><Plus className="h-3.5 w-3.5" />Nova tarefa</button>}</div>

      {nextTask ? <div className="rounded-xl border border-accent/30 bg-accent/5 p-4"><p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-accent"><ArrowRight className="h-3 w-3" />Próxima ação</p><div className="mt-2 flex items-center justify-between gap-3"><div><p className="text-[13px] font-semibold">{nextTask.titulo}</p><p className="mt-1 text-[10px] text-muted-foreground">{nextTask.responsavelNome} · prazo {formatTaskDate(nextTask.prazo)}</p></div><span className="rounded-full border border-accent/25 px-2 py-1 text-[9px] text-accent">{nextTask.tipo}</span></div></div> : <div className="rounded-xl border border-dashed border-border/30 p-5 text-center"><ListTodo className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-[11px] font-medium">Nenhuma próxima ação definida</p><p className="mt-1 text-[9px] text-muted-foreground">Crie uma tarefa para deixar claro o próximo passo.</p></div>}

      {isLoading ? <p className="py-8 text-center text-[11px] text-muted-foreground">Carregando tarefas...</p> : <PipelineTaskKanban tasks={displayedTasks} highlightedTaskId={initialTaskId ?? nextTask?.id} canEdit={canEdit} canMove={canConclude && !setStatus.isPending} onEdit={setEditingTask} onMove={(task, status) => void moveTask(task, status)} />}

      {editingTask !== undefined && <PipelineTarefaDialog tarefa={editingTask} usuarios={usuarios} defaultResponsavelId={responsavelId} isProcessing={processing} onClose={() => setEditingTask(undefined)} onSave={(input) => void saveTask(input)} />}
    </div>
  );
};
