import { useState } from "react";
import { CalendarCheck2, Filter, ListTodo } from "lucide-react";
import { toast } from "sonner";
import {
  usePipelineTarefas,
  useSetPipelineTarefaStatus,
  type PipelineTarefa,
  type PipelineTarefaVisao,
} from "@/services/usePipelineAtividades";
import type { PipelineNegocio } from "@/services/usePipelineVendas";
import type { Usuario } from "@/services/useUsuarios";
import { PipelineTaskCard } from "./PipelineTaskCard";
import { UserSelect } from "@/components/users/UserSelect";

interface PipelineTarefasVisaoProps {
  funilId?: number;
  campanhaId?: number;
  negocios: PipelineNegocio[];
  usuarios: Usuario[];
  canView: boolean;
  canViewAll: boolean;
  canConclude: boolean;
  onOpenNegocio: (negocio: PipelineNegocio) => void;
}

const views: { value: PipelineTarefaVisao; label: string }[] = [
  { value: "HOJE", label: "Hoje" },
  { value: "ATRASADAS", label: "Atrasadas" },
  { value: "FUTURAS", label: "Futuras" },
  { value: "CONCLUIDAS", label: "Concluídas" },
  { value: "TODAS", label: "Todas" },
];

const fieldClass = "h-9 rounded-lg border border-border/25 bg-card/45 px-3 text-[10px] outline-none focus:border-accent/40";

export const PipelineTarefasVisao = ({ funilId, campanhaId, negocios, usuarios, canView, canViewAll, canConclude, onOpenNegocio }: PipelineTarefasVisaoProps) => {
  const [view, setView] = useState<PipelineTarefaVisao>("HOJE");
  const [responsible, setResponsible] = useState("");
  const [business, setBusiness] = useState("");
  const [type, setType] = useState("");
  const [canceladas, setCanceladas] = useState(false);
  const { data: tasks = [], isLoading, error } = usePipelineTarefas({
    visao: canceladas ? "TODAS" : view,
    funilId,
    responsavelId: responsible ? Number(responsible) : null,
    negocioId: business ? Number(business) : null,
    tipo: type,
  }, canView);
  const filteredTasks = tasks.filter(t => (!campanhaId || (t.campanhaId ?? negocios.find(n => n.id === t.negocioId)?.campanhaOrigemId) === campanhaId) && (!canceladas || t.status === "CANCELADA"));
  const setStatus = useSetPipelineTarefaStatus();

  const toggleTask = async (task: PipelineTarefa) => {
    try {
      await setStatus.mutateAsync({ tarefaId: task.id, status: task.status === "CONCLUIDA" ? "PENDENTE" : "CONCLUIDA" });
      toast.success(task.status === "CONCLUIDA" ? "Tarefa reaberta" : "Tarefa concluída");
    } catch (statusError) {
      toast.error(statusError instanceof Error ? statusError.message : "Erro ao alterar a tarefa");
    }
  };

  const openBusiness = (task: PipelineTarefa) => {
    const negocio = negocios.find((item) => item.id === task.negocioId);
    if (negocio) onOpenNegocio(negocio);
  };

  if (!canView) return <div className="rounded-xl border border-border/25 bg-muted/10 p-12 text-center text-sm text-muted-foreground">Você não possui permissão para visualizar as tarefas comerciais.</div>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-[15px] font-semibold"><CalendarCheck2 className="h-4 w-4 text-accent" />Agenda comercial</h2><p className="mt-1 text-[10px] text-muted-foreground">Consulte atividades por prazo, responsável, negócio e tipo.</p></div><span className="rounded-full border border-border/25 bg-card/40 px-3 py-1 text-[9px] text-muted-foreground">{filteredTasks.length} tarefa(s)</span></div>

      <div className="mb-4 flex flex-wrap gap-2">{views.map((item) => <button key={item.value} type="button" onClick={() => { setView(item.value); setCanceladas(false); }} className={`h-8 rounded-lg px-3 text-[10px] font-medium transition-colors ${!canceladas && view === item.value ? "bg-accent text-accent-foreground" : "border border-border/25 bg-card/35 text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}<button type="button" onClick={() => setCanceladas(true)} className={`rounded border px-3 text-xs ${canceladas ? "bg-accent text-accent-foreground" : ""}`}>Canceladas</button></div>

      <div className="mb-4 grid gap-2 rounded-xl border border-border/20 bg-card/25 p-3 sm:grid-cols-3"><div className="flex min-w-0 items-center gap-2"><Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />{canViewAll ? <UserSelect users={usuarios} value={responsible} onValueChange={setResponsible} placeholder="Todos os responsáveis" emptyLabel="Todos os responsáveis" ariaLabel="Filtrar por responsável" className="h-10 min-w-0 flex-1" /> : <div className="flex h-10 min-w-0 flex-1 items-center rounded-lg border border-border/25 bg-card/45 px-3 text-[10px] text-muted-foreground">Minhas tarefas e da minha equipe</div>}</div><select value={business} onChange={(event) => setBusiness(event.target.value)} className={fieldClass}><option value="">Todos os negócios</option>{negocios.map((negocio) => <option key={negocio.id} value={negocio.id}>{negocio.nomeEmpresa}</option>)}</select><input value={type} onChange={(event) => setType(event.target.value)} className={fieldClass} placeholder="Filtrar por tipo (ex.: Follow-up)" /></div>

      {isLoading ? <div className="py-20 text-center text-sm text-muted-foreground">Carregando tarefas...</div> : error ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar as tarefas comerciais.</div> : <div className="grid gap-3 lg:grid-cols-2">{filteredTasks.map((task) => <PipelineTaskCard key={task.id} task={task} showBusiness canConclude={canConclude} onToggleComplete={() => void toggleTask(task)} onOpenBusiness={() => openBusiness(task)} />)}{filteredTasks.length === 0 && <div className="col-span-full py-20 text-center"><ListTodo className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 text-[12px] font-medium">Nenhuma tarefa encontrada</p><p className="mt-1 text-[10px] text-muted-foreground">Ajuste os filtros ou crie uma tarefa dentro de um negócio.</p></div>}</div>}
    </div>
  );
};
