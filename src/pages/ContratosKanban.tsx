import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Save,
  Search,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import ClimbLogo from "@/components/login/ClimbLogo";
import { KanbanTaskCard } from "@/components/kanban/KanbanTaskCard";
import { KanbanTaskDialog, type KanbanTaskDraft } from "@/components/kanban/KanbanTaskDialog";
import { KanbanTaskEditDialog } from "@/components/kanban/KanbanTaskEditDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useContratoKanban,
  useContratos,
  useUsuarios,
  useCreateKanbanSubtarefa,
  useCreateKanbanRaia,
  useCreateKanbanTask,
  useDeleteKanbanSubtarefa,
  useDeleteKanbanRaia,
  useDeleteKanbanTask,
  useMoveKanbanTask,
  useToggleKanbanSubtarefa,
  useUpdateKanbanSubtarefa,
  useUpdateKanbanRaia,
  useUpdateKanbanTask,
  type Contrato,
  type ContratoKanbanSubtarefa,
  type ContratoKanbanTask,
  type KanbanTaskDTO,
} from "@/services";

interface PendingRaiaRemoval {
  id: number;
  titulo: string;
  tarefas: number;
}

const emptyDraft: KanbanTaskDraft = {
  titulo: "",
  descricao: "",
  prioridade: "MEDIA",
  responsavelId: "",
  dataInicio: "",
  dataFim: "",
};

function getContratoLabel(contrato: Contrato) {
  return `CT-${contrato.id} · ${contrato.empresaNome}`;
}

const ContratosKanban = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [newRaiaTitle, setNewRaiaTitle] = useState("");
  const [taskModalRaiaId, setTaskModalRaiaId] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [taskDraft, setTaskDraft] = useState<KanbanTaskDraft>(emptyDraft);
  const [editingRaiaId, setEditingRaiaId] = useState<number | null>(null);
  const [editingRaiaTitle, setEditingRaiaTitle] = useState("");
  const [draggedTask, setDraggedTask] = useState<{ task: ContratoKanbanTask; fromRaiaId: number } | null>(null);
  const [dragOverRaiaId, setDragOverRaiaId] = useState<number | null>(null);
  const [pendingRaiaRemoval, setPendingRaiaRemoval] = useState<PendingRaiaRemoval | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const navigate = useNavigate();

  const { data: contratos = [], isLoading: contratosLoading } = useContratos();
  const contratosAprovados = useMemo(
    () => contratos.filter((contrato) => contrato.status === "APROVADO"),
    [contratos],
  );
  const requestedContratoId = Number(searchParams.get("contrato"));
  const selectedContratoId =
    contratosAprovados.some((contrato) => contrato.id === requestedContratoId)
      ? requestedContratoId
      : contratosAprovados[0]?.id;
  const selectedContrato = contratosAprovados.find((contrato) => contrato.id === selectedContratoId);
  const { data: board, isLoading: boardLoading, error: boardError } = useContratoKanban(selectedContratoId);
  const { data: usuariosComPerfil = [] } = useUsuarios();
  const editingTask = useMemo(
    () => board?.raias.flatMap((raia) => raia.tasks).find((task) => task.id === editingTaskId),
    [board, editingTaskId],
  );
  const usuariosKanban = useMemo(() => {
    const usuariosDisponiveis = board?.usuariosDisponiveis || board?.participantes || [];
    return usuariosDisponiveis.map((usuario) => {
      const perfil = usuariosComPerfil.find((item) => item.id === usuario.id);
      return {
        ...usuario,
        cargo: perfil?.cargo || usuario.cargo,
        cargoNome: perfil?.cargoNome || usuario.cargoNome,
        fotoPerfil: perfil?.fotoPerfil || usuario.fotoPerfil,
      };
    });
  }, [board?.participantes, board?.usuariosDisponiveis, usuariosComPerfil]);

  const createRaia = useCreateKanbanRaia();
  const updateRaia = useUpdateKanbanRaia();
  const deleteRaia = useDeleteKanbanRaia();
  const createTask = useCreateKanbanTask();
  const updateTask = useUpdateKanbanTask();
  const moveTask = useMoveKanbanTask();
  const deleteTask = useDeleteKanbanTask();
  const createSubtask = useCreateKanbanSubtarefa();
  const updateSubtask = useUpdateKanbanSubtarefa();
  const toggleSubtask = useToggleKanbanSubtarefa();
  const deleteSubtask = useDeleteKanbanSubtarefa();

  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);
  const userName =
    basicUserData?.nomeCompleto ||
    userData?.nomeCompleto ||
    userData?.pessoa?.nomeCompleto ||
    "Usuario";
  const userPhoto =
    basicUserData?.fotoPerfil ||
    userData?.fotoPerfil ||
    userData?.pessoa?.fotoPerfil ||
    null;
  const usuarioId = basicUserData?.id ?? userData?.id ?? null;

  const filteredContratos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return contratosAprovados;
    return contratosAprovados.filter((contrato) =>
      `${contrato.id} ${contrato.empresaNome} ${contrato.titulo}`.toLowerCase().includes(query),
    );
  }, [contratosAprovados, searchQuery]);

  useEffect(() => {
    if (selectedContratoId && searchParams.get("contrato") !== String(selectedContratoId)) {
      setSearchParams({ contrato: String(selectedContratoId) }, { replace: true });
    }
  }, [searchParams, selectedContratoId, setSearchParams]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);

  function selectContrato(id: number) {
    setSearchParams({ contrato: String(id) });
    setEditingRaiaId(null);
    setDraggedTask(null);
    setDragOverRaiaId(null);
    setPendingRaiaRemoval(null);
    setTaskModalRaiaId(null);
    setEditingTaskId(null);
    setTaskDraft(emptyDraft);
    setMessage(null);
  }

  function openTaskModal(raiaId: number) {
    setTaskModalRaiaId(raiaId);
    setTaskDraft(emptyDraft);
    setMessage(null);
  }

  async function handleCreateRaia(title = newRaiaTitle) {
    const titulo = title.trim();

    if (!selectedContratoId) {
      setMessage({ type: "error", text: "Selecione um contrato antes de criar a raia." });
      return;
    }
    if (!titulo) {
      setMessage({ type: "error", text: "Informe o nome da raia." });
      return;
    }

    try {
      await createRaia.mutateAsync({ contratoId: selectedContratoId, data: { titulo } });
      setNewRaiaTitle("");
      setMessage({ type: "success", text: "Raia criada com sucesso." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao criar raia." });
    }
  }

  async function handleCreateDefaultRaias() {
    for (const title of ["A fazer", "Em andamento", "Concluído"]) {
      await handleCreateRaia(title);
    }
  }

  async function handleSaveRaia(raiaId: number) {
    if (!selectedContratoId || !editingRaiaTitle.trim()) return;

    try {
      await updateRaia.mutateAsync({
        contratoId: selectedContratoId,
        raiaId,
        data: { titulo: editingRaiaTitle.trim() },
      });
      setEditingRaiaId(null);
      setEditingRaiaTitle("");
      setMessage({ type: "success", text: "Raia atualizada." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao atualizar raia." });
    }
  }

  async function performDeleteRaia(raiaId: number) {
    if (!selectedContratoId) return;

    try {
      await deleteRaia.mutateAsync({ contratoId: selectedContratoId, raiaId });
      setPendingRaiaRemoval(null);
      setMessage({ type: "success", text: "Raia removida." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao remover raia." });
    }
  }

  function handleDeleteRaia(raiaId: number) {
    const raia = board?.raias.find((item) => item.id === raiaId);
    if (!raia) return;

    if (raia.tasks.length > 0) {
      setPendingRaiaRemoval({
        id: raia.id,
        titulo: raia.titulo,
        tarefas: raia.tasks.length,
      });
      setMessage(null);
      return;
    }

    void performDeleteRaia(raiaId);
  }

  async function handleCreateTask() {
    if (!selectedContratoId || !taskModalRaiaId) return;
    if (!taskDraft.titulo.trim()) {
      setMessage({ type: "error", text: "Informe o título da tarefa." });
      return;
    }

    try {
      await createTask.mutateAsync({
        contratoId: selectedContratoId,
        data: {
          raiaId: taskModalRaiaId,
          titulo: taskDraft.titulo.trim(),
          descricao: taskDraft.descricao.trim(),
          prioridade: taskDraft.prioridade,
          responsavelId: taskDraft.responsavelId ? Number(taskDraft.responsavelId) : null,
          dataInicio: taskDraft.dataInicio || undefined,
          dataFim: taskDraft.dataFim || undefined,
        },
      });
      setTaskDraft(emptyDraft);
      setTaskModalRaiaId(null);
      setMessage({ type: "success", text: "Tarefa criada com sucesso." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao criar tarefa." });
    }
  }

  async function handleSaveTask(task: ContratoKanbanTask) {
    if (!selectedContratoId) return false;
    const payload: KanbanTaskDTO = {
      raiaId: task.raiaId,
      titulo: task.titulo,
      descricao: task.descricao || "",
      prioridade: task.prioridade,
      responsavelId: task.responsavel?.id ?? null,
      dataInicio: task.dataInicio || undefined,
      dataFim: task.dataFim || undefined,
      posicao: task.posicao,
    };

    try {
      await updateTask.mutateAsync({ contratoId: selectedContratoId, taskId: task.id, data: payload });
      setMessage({ type: "success", text: "Tarefa atualizada." });
      return true;
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao atualizar tarefa." });
      return false;
    }
  }

  async function handleMoveTask(task: ContratoKanbanTask, raiaId: number) {
    if (!selectedContratoId || task.raiaId === raiaId) return;

    try {
      await moveTask.mutateAsync({
        contratoId: selectedContratoId,
        taskId: task.id,
        data: { raiaId },
      });
      setMessage({ type: "success", text: "Tarefa movida com sucesso." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao mover tarefa." });
    }
  }

  function handleTaskDragStart(event: React.DragEvent<HTMLDivElement>, task: ContratoKanbanTask, fromRaiaId: number) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(task.id));
    setDraggedTask({ task, fromRaiaId });
    setMessage(null);
  }

  function handleRaiaDragOver(event: React.DragEvent<HTMLDivElement>, raiaId: number) {
    if (!draggedTask) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverRaiaId(raiaId);
  }

  async function handleRaiaDrop(raiaId: number) {
    const currentDraggedTask = draggedTask;
    setDraggedTask(null);
    setDragOverRaiaId(null);

    if (!currentDraggedTask || currentDraggedTask.fromRaiaId === raiaId) return;
    await handleMoveTask(currentDraggedTask.task, raiaId);
  }

  function handleTaskDragEnd() {
    setDraggedTask(null);
    setDragOverRaiaId(null);
  }

  async function handleDeleteTask(taskId: number) {
    if (!selectedContratoId) return;

    try {
      await deleteTask.mutateAsync({ contratoId: selectedContratoId, taskId });
      setMessage({ type: "success", text: "Tarefa removida." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao remover tarefa." });
    }
  }

  async function handleCreateSubtask(taskId: number, titulo: string) {
    if (!selectedContratoId) return false;
    try {
      await createSubtask.mutateAsync({ contratoId: selectedContratoId, taskId, data: { titulo } });
      setMessage({ type: "success", text: "Subtarefa criada." });
      return true;
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao criar subtarefa." });
      return false;
    }
  }

  async function handleUpdateSubtask(taskId: number, subtarefa: ContratoKanbanSubtarefa) {
    if (!selectedContratoId) return false;
    try {
      await updateSubtask.mutateAsync({
        contratoId: selectedContratoId,
        taskId,
        subtarefaId: subtarefa.id,
        data: {
          titulo: subtarefa.titulo,
          concluida: subtarefa.concluida,
          posicao: subtarefa.posicao,
        },
      });
      setMessage({ type: "success", text: "Subtarefa atualizada." });
      return true;
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao atualizar subtarefa." });
      return false;
    }
  }

  async function handleToggleSubtask(taskId: number, subtarefa: ContratoKanbanSubtarefa) {
    if (!selectedContratoId) return;
    try {
      await toggleSubtask.mutateAsync({
        contratoId: selectedContratoId,
        taskId,
        subtarefaId: subtarefa.id,
        concluida: !subtarefa.concluida,
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao concluir subtarefa." });
    }
  }

  async function handleDeleteSubtask(taskId: number, subtarefaId: number) {
    if (!selectedContratoId) return;
    try {
      await deleteSubtask.mutateAsync({ contratoId: selectedContratoId, taskId, subtarefaId });
      setMessage({ type: "success", text: "Subtarefa removida." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao remover subtarefa." });
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)` }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <motion.aside className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}`} initial={false} animate={{ x: 0, opacity: 1 }}>
          <div className={`flex h-16 items-center border-b border-border/20 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
            {sidebarCollapsed ? <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">C</div> : <ClimbLogo className="h-[16px] text-foreground" />}
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
            <AppSidebarNav collapsed={sidebarCollapsed} />
          </nav>
          <div className="space-y-1 border-t border-border/20 px-2 py-3">
            <motion.button onClick={() => setIsDark(!isDark)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:bg-muted/30 hover:text-foreground ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}>
              <AnimatePresence mode="wait"><motion.div key={isDark ? "s" : "m"} initial={{ opacity: 0, rotate: -30 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 30 }}>{isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</motion.div></AnimatePresence>
              {!sidebarCollapsed && <span className="text-[13px] font-medium">{isDark ? "Modo claro" : "Modo escuro"}</span>}
            </motion.button>
            <Link to="/"><motion.button className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground/50 transition-all hover:bg-destructive/5 hover:text-destructive ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}><LogOut className="h-[18px] w-[18px]" />{!sidebarCollapsed && <span className="text-[13px] font-medium">Sair</span>}</motion.button></Link>
          </div>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border/40 bg-card text-muted-foreground shadow-sm transition-all hover:border-accent/40 hover:text-foreground">
            {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </motion.aside>

        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"}`}>
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/20 bg-background/80 px-6 backdrop-blur-xl">
            <div className="flex h-9 w-[280px] items-center gap-2 rounded-lg border border-border/25 bg-card/30 px-3 text-muted-foreground/50 backdrop-blur-sm">
              <Search className="h-3.5 w-3.5" />
              <input type="text" placeholder="Buscar contratos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground/30" />
            </div>
            <UserAvatar name={userName} photoUrl={userPhoto} />
          </header>

          <div className="grid min-h-[calc(100vh-64px)] grid-cols-[280px_1fr]">
            <aside className="border-r border-border/20 bg-card/25 p-4">
              <div className="mb-3 flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-accent" />
                <h1 className="text-[16px] font-semibold text-foreground">Kanban</h1>
              </div>
              <div className="space-y-2">
                {contratosLoading ? (
                  <div className="py-10 text-center text-[12px] text-muted-foreground/45">Carregando contratos...</div>
                ) : filteredContratos.length === 0 ? (
                  <div className="py-10 text-center text-[12px] text-muted-foreground/35">Nenhum contrato aprovado encontrado</div>
                ) : (
                  filteredContratos.map((contrato) => (
                    <button
                      key={contrato.id}
                      type="button"
                      onClick={() => selectContrato(contrato.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${contrato.id === selectedContratoId ? "border-accent/35 bg-accent/10 text-accent" : "border-border/20 bg-background/35 text-foreground/70 hover:border-accent/25 hover:bg-muted/15"}`}
                    >
                      <p className="truncate text-[12px] font-semibold">{getContratoLabel(contrato)}</p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground/45">{contrato.titulo}</p>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <section className="min-w-0 p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-[22px] font-bold tracking-tight text-foreground">
                    {selectedContrato ? getContratoLabel(selectedContrato) : "Selecione um contrato"}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-muted-foreground/50">
                    {board?.responsavel ? `Gestor: ${board.responsavel.nomeCompleto}` : "Gestor não definido"}
                    {board?.gestor ? " · Você pode editar este quadro" : ""}
                  </p>
                </div>
                {board?.gestor && (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleCreateRaia();
                    }}
                  >
                    <input value={newRaiaTitle} onChange={(e) => setNewRaiaTitle(e.target.value)} placeholder="Nova raia" className="h-9 w-40 rounded-lg border border-border/25 bg-background/60 px-3 text-[12px] outline-none transition-colors focus:border-accent/40" />
                    <button type="submit" disabled={createRaia.isPending} className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-[12px] font-semibold text-accent-foreground shadow-[0_2px_10px_-2px_hsl(var(--accent)/0.3)] transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">
                      <Plus className="h-3.5 w-3.5" /> {createRaia.isPending ? "Criando..." : "Raia"}
                    </button>
                  </form>
                )}
              </div>

              <AnimatePresence>
                {message && (
                  <motion.div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] ${message.type === "error" ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-accent/20 bg-accent/5 text-accent"}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    {message.type === "error" ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>{message.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {boardLoading ? (
                <div className="py-16 text-center text-[12px] text-muted-foreground/45">Carregando quadro...</div>
              ) : boardError ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">Erro ao carregar Kanban do contrato.</div>
              ) : !board ? (
                <div className="py-16 text-center text-[12px] text-muted-foreground/45">Nenhum contrato selecionado.</div>
              ) : board.raias.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-border/30 bg-card/25 text-center">
                  <LayoutDashboard className="mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-[13px] font-semibold text-foreground/70">Este contrato ainda não tem raias</p>
                  {board.gestor && (
                    <button type="button" onClick={handleCreateDefaultRaias} className="mt-4 rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-accent-foreground">Criar quadro padrão</button>
                  )}
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {board.raias.map((raia) => (
                    <div
                      key={raia.id}
                      onDragOver={(event) => handleRaiaDragOver(event, raia.id)}
                      onDragLeave={() => setDragOverRaiaId((current) => current === raia.id ? null : current)}
                      onDrop={() => handleRaiaDrop(raia.id)}
                      className={`flex w-[320px] shrink-0 flex-col rounded-lg border bg-card/40 transition-all duration-200 ${dragOverRaiaId === raia.id ? "scale-[1.01] border-accent/45 bg-accent/[0.04]" : "border-border/25"}`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-border/15 px-3 py-2">
                        {editingRaiaId === raia.id ? (
                          <input value={editingRaiaTitle} onChange={(e) => setEditingRaiaTitle(e.target.value)} className="h-8 min-w-0 flex-1 rounded-md border border-border/25 bg-background/60 px-2 text-[12px] font-semibold outline-none focus:border-accent/40" />
                        ) : (
                          <button type="button" disabled={!board.gestor} onClick={() => { setEditingRaiaId(raia.id); setEditingRaiaTitle(raia.titulo); }} className="min-w-0 truncate text-left text-[13px] font-semibold text-foreground/80 disabled:cursor-default">
                            {raia.titulo}
                          </button>
                        )}
                        {board.gestor && (
                          <div className="flex items-center gap-1">
                            {editingRaiaId === raia.id && (
                              <button type="button" title="Salvar raia" onClick={() => handleSaveRaia(raia.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/10 hover:text-accent">
                                <Save className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button type="button" title="Remover raia" onClick={() => handleDeleteRaia(raia.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 p-3">
                        {raia.tasks.length === 0 ? (
                          <div className={`rounded-lg border border-dashed py-8 text-center text-[12px] transition-colors ${dragOverRaiaId === raia.id ? "border-accent/40 bg-accent/5 text-accent" : "border-border/25 text-muted-foreground/35"}`}>
                            {dragOverRaiaId === raia.id ? "Solte a tarefa aqui" : "Sem tarefas"}
                          </div>
                        ) : (
                          raia.tasks.map((task) => (
                            <KanbanTaskCard
                              key={task.id}
                              task={task}
                              gestor={board.gestor}
                              usuarioId={usuarioId}
                              isDragging={draggedTask?.task.id === task.id}
                              movePending={moveTask.isPending}
                              subtaskPending={createSubtask.isPending || updateSubtask.isPending || toggleSubtask.isPending || deleteSubtask.isPending}
                              onDragStart={(event) => handleTaskDragStart(event, task, raia.id)}
                              onDragEnd={handleTaskDragEnd}
                              onEdit={(taskToEdit) => setEditingTaskId(taskToEdit.id)}
                              onDelete={handleDeleteTask}
                              onToggleSubtask={handleToggleSubtask}
                            />
                          ))
                        )}
                      </div>

                      {board.gestor && (
                        <div className="border-t border-border/15 p-3">
                          <button type="button" onClick={() => openTaskModal(raia.id)} className="flex h-8 w-full items-center justify-center gap-2 rounded-md bg-accent text-[12px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                            <Plus className="h-3.5 w-3.5" /> Adicionar tarefa
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {pendingRaiaRemoval && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setPendingRaiaRemoval(null)} />
            <motion.div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-destructive/25 bg-card/95 shadow-2xl backdrop-blur-xl" initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}>
              <div className="flex items-start gap-3 border-b border-border/20 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-semibold text-foreground">Remover raia com tarefas?</h2>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground/60">
                    A raia <span className="font-semibold text-foreground/80">{pendingRaiaRemoval.titulo}</span> possui {pendingRaiaRemoval.tarefas} {pendingRaiaRemoval.tarefas === 1 ? "tarefa vinculada" : "tarefas vinculadas"}.
                  </p>
                </div>
                <button type="button" onClick={() => setPendingRaiaRemoval(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-lg border border-destructive/15 bg-destructive/5 px-3 py-2 text-[12px] leading-relaxed text-destructive">
                  Ao confirmar, a raia e suas tarefas serão removidas do quadro.
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setPendingRaiaRemoval(null)} disabled={deleteRaia.isPending} className="h-9 rounded-lg border border-border/30 px-4 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50">
                    Cancelar
                  </button>
                  <button type="button" onClick={() => performDeleteRaia(pendingRaiaRemoval.id)} disabled={deleteRaia.isPending} className="flex h-9 items-center gap-2 rounded-lg bg-destructive px-4 text-[12px] font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleteRaia.isPending ? "Removendo..." : "Remover raia"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {taskModalRaiaId && board?.gestor && (
        <KanbanTaskDialog
          raiaTitulo={board.raias.find((raia) => raia.id === taskModalRaiaId)?.titulo || "Raia selecionada"}
          draft={taskDraft}
          usuarios={usuariosKanban}
          isSaving={createTask.isPending}
          onChange={setTaskDraft}
          onClose={() => { setTaskModalRaiaId(null); setTaskDraft(emptyDraft); }}
          onSubmit={handleCreateTask}
        />
      )}

      {editingTask && board?.gestor && (
        <KanbanTaskEditDialog
          key={editingTask.id}
          task={editingTask}
          usuarios={usuariosKanban}
          isSaving={updateTask.isPending}
          subtaskPending={createSubtask.isPending || updateSubtask.isPending || toggleSubtask.isPending || deleteSubtask.isPending}
          onClose={() => setEditingTaskId(null)}
          onSave={handleSaveTask}
          onCreateSubtask={handleCreateSubtask}
          onUpdateSubtask={handleUpdateSubtask}
          onToggleSubtask={handleToggleSubtask}
          onDeleteSubtask={handleDeleteSubtask}
        />
      )}
    </div>
  );
};

export default ContratosKanban;
