import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, CalendarCheck2, CircleDollarSign, Columns3, Plus, TrendingUp, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PipelineKanbanBoard } from "@/components/pipeline/PipelineKanbanBoard";
import { PipelineNegocioDialog } from "@/components/pipeline/PipelineNegocioDialog";
import { PipelinePerdaDialog } from "@/components/pipeline/PipelinePerdaDialog";
import { PipelineTarefasVisao } from "@/components/pipeline/PipelineTarefasVisao";
import { PipelineVendasShell } from "@/components/pipeline/PipelineVendasShell";
import { useEmpresas } from "@/services/useEmpresas";
import { usePipelineFunisAtivos } from "@/services/usePipelineFunis";
import { usePipelineMotivosPerdaAtivos } from "@/services/usePipelineMotivosPerda";
import {
  useConcludePipelineNegocio,
  useConvertPipelineNegocio,
  useCreatePipelineNegocio,
  useMovePipelineNegocio,
  usePipelineVendas,
  useReactivatePipelineNegocio,
  useUpdatePipelineNegocio,
  type PipelineNegocio,
  type PipelineNegocioInput,
} from "@/services/usePipelineVendas";
import { useUsuarioPermissoes } from "@/services/usePermissoes";
import { useUsuarios } from "@/services/useUsuarios";
import { useAuthStore } from "@/store/useAuthStore";

const commercialPermissions = {
  view: "COMERCIAL",
  create: "COMERCIAL_CRIAR",
  edit: "COMERCIAL_EDITAR",
  move: "COMERCIAL_MOVIMENTAR",
  conclude: "COMERCIAL_CONCLUIR",
  convert: "COMERCIAL_CONVERTER_CONTRATO",
  taskView: "COMERCIAL_TAREFA_VISUALIZAR",
  taskCreate: "COMERCIAL_TAREFA_CRIAR",
  taskEdit: "COMERCIAL_TAREFA_EDITAR",
  taskConclude: "COMERCIAL_TAREFA_CONCLUIR",
  commentView: "COMERCIAL_COMENTARIO_VISUALIZAR",
  commentCreate: "COMERCIAL_COMENTARIO_CRIAR",
  historyView: "COMERCIAL_HISTORICO_VISUALIZAR",
} as const;

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
}).format(value);

const PipelineVendas = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"pipeline" | "tarefas">("pipeline");
  const [selectedFunnelId, setSelectedFunnelId] = useState<number>();
  const [selectedBusiness, setSelectedBusiness] = useState<PipelineNegocio | null>(null);
  const [createStageId, setCreateStageId] = useState<number | null>(null);
  const [pendingLoss, setPendingLoss] = useState<{ business: PipelineNegocio; stageId: number } | null>(null);
  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);
  const userId = basicUserData?.id ?? userData?.id;
  const { data: associations = [], isLoading: permissionsLoading } = useUsuarioPermissoes(userId);
  const permissionCodes = useMemo(() => new Set(associations.map((item) => item.permissao.codigo)), [associations]);
  const can = (permission: string) => permissionCodes.has(permission);

  const { data: funnels = [], isLoading: funnelsLoading } = usePipelineFunisAtivos();
  const effectiveFunnelId = selectedFunnelId ?? funnels[0]?.id;
  const { data: board, isLoading, error } = usePipelineVendas(effectiveFunnelId);
  const { data: lossReasons = [] } = usePipelineMotivosPerdaAtivos();
  const { data: users = [] } = useUsuarios();
  const { data: companies = [] } = useEmpresas();
  const createBusiness = useCreatePipelineNegocio();
  const updateBusiness = useUpdatePipelineNegocio();
  const moveBusiness = useMovePipelineNegocio();
  const concludeBusiness = useConcludePipelineNegocio();
  const reactivateBusiness = useReactivatePipelineNegocio();
  const convertBusiness = useConvertPipelineNegocio();
  const isProcessing = [createBusiness, updateBusiness, moveBusiness, concludeBusiness, reactivateBusiness, convertBusiness]
    .some((mutation) => mutation.isPending);

  const allBusinesses = useMemo(() => (board?.etapas || []).flatMap((stage) => stage.negocios), [board?.etapas]);
  const filteredStages = useMemo(() => (board?.etapas || []).map((stage) => ({
    ...stage,
    negocios: stage.negocios.filter((business) => `${business.nomeEmpresa} ${business.nomeContato} ${business.responsavelNome} ${business.servicoInteresse}`.toLowerCase().includes(search.trim().toLowerCase())),
  })), [board?.etapas, search]);
  const openBusinesses = allBusinesses.filter((item) => item.resultado === "ABERTO");
  const pipelineValue = openBusinesses.reduce((total, item) => total + (item.valorEstimadoProposta || 0), 0);

  const closeDialog = () => {
    setSelectedBusiness(null);
    setCreateStageId(null);
  };

  const saveBusiness = async (data: PipelineNegocioInput) => {
    try {
      const funnelData = { ...data, funilId: selectedBusiness?.funilId ?? effectiveFunnelId };
      if (selectedBusiness) await updateBusiness.mutateAsync({ id: selectedBusiness.id, data: funnelData });
      else await createBusiness.mutateAsync(funnelData);
      toast.success(selectedBusiness ? "Negócio atualizado" : "Negócio criado");
      closeDialog();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Erro ao salvar negócio");
    }
  };

  const conclude = async (result: "GANHO" | "PERDIDO", motivoPerdaId?: number, observacaoPerda?: string) => {
    if (!selectedBusiness) return;
    try {
      const updated = await concludeBusiness.mutateAsync({ id: selectedBusiness.id, resultado: result, motivoPerdaId, observacaoPerda });
      setSelectedBusiness(updated);
      toast.success(result === "GANHO" ? "Negócio marcado como ganho" : "Negócio marcado como perdido");
    } catch (concludeError) {
      toast.error(concludeError instanceof Error ? concludeError.message : "Erro ao concluir negócio");
    }
  };

  const reactivate = async () => {
    if (!selectedBusiness) return;
    try {
      const updated = await reactivateBusiness.mutateAsync({ id: selectedBusiness.id });
      setSelectedBusiness(updated);
      toast.success("Negócio reativado");
    } catch (reactivateError) {
      toast.error(reactivateError instanceof Error ? reactivateError.message : "Erro ao reativar negócio");
    }
  };

  const convert = async (companyId: number) => {
    if (!selectedBusiness) return;
    try {
      const updated = await convertBusiness.mutateAsync({ id: selectedBusiness.id, empresaId: companyId });
      setSelectedBusiness(updated);
      toast.success(`Contrato CT-${updated.contratoId} criado`);
    } catch (convertError) {
      toast.error(convertError instanceof Error ? convertError.message : "Erro ao converter negócio");
    }
  };

  const move = async (business: PipelineNegocio, stageId: number) => {
    if (!can(commercialPermissions.move)) return;
    const destination = board?.etapas.find((stage) => stage.id === stageId);
    if (destination?.resultado === "PERDIDO") {
      setPendingLoss({ business, stageId });
      return;
    }
    try {
      await moveBusiness.mutateAsync({ id: business.id, etapaId: stageId });
      toast.success("Negócio movimentado");
    } catch (moveError) {
      toast.error(moveError instanceof Error ? moveError.message : "Erro ao movimentar negócio");
    }
  };

  const confirmDraggedLoss = async (motivoPerdaId: number, observacaoPerda?: string) => {
    if (!pendingLoss) return;
    try {
      await moveBusiness.mutateAsync({ id: pendingLoss.business.id, etapaId: pendingLoss.stageId, motivoPerdaId, observacaoPerda });
      toast.success("Negócio marcado como perdido");
      setPendingLoss(null);
    } catch (moveError) {
      toast.error(moveError instanceof Error ? moveError.message : "Erro ao movimentar negócio");
    }
  };

  if (!permissionsLoading && !can(commercialPermissions.view)) {
    return <PipelineVendasShell search={search} onSearchChange={setSearch}><div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6"><div className="max-w-md rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"><AlertCircle className="mx-auto h-8 w-8 text-destructive" /><h1 className="mt-4 text-lg font-semibold">Acesso comercial necessário</h1><p className="mt-2 text-sm text-muted-foreground">Solicite a permissão Comercial para visualizar o Pipeline de Vendas.</p></div></div></PipelineVendasShell>;
  }

  return (
    <PipelineVendasShell search={search} onSearchChange={setSearch}>
      <section className="p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent" /><h1 className="text-[22px] font-bold tracking-tight">Pipeline de Vendas</h1></div><p className="mt-1 text-[12px] text-muted-foreground/55">Acompanhe oportunidades e deixe a próxima ação sempre clara.</p></div>
          <div className="flex flex-wrap gap-2"><div className="flex rounded-lg border border-border/25 bg-card/40 p-1"><button type="button" onClick={() => setView("pipeline")} className={`flex h-8 items-center gap-2 rounded-md px-3 text-[10px] font-medium ${view === "pipeline" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}><Columns3 className="h-3.5 w-3.5" />Pipeline</button><button type="button" onClick={() => setView("tarefas")} className={`flex h-8 items-center gap-2 rounded-md px-3 text-[10px] font-medium ${view === "tarefas" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}><CalendarCheck2 className="h-3.5 w-3.5" />Tarefas</button></div>{can(commercialPermissions.create) && <button type="button" onClick={() => setCreateStageId(board?.etapas.find((stage) => stage.resultado === "ABERTO")?.id || null)} className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-[12px] font-semibold text-accent-foreground shadow-lg shadow-accent/10"><Plus className="h-4 w-4" />Novo negócio</button>}</div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-border/25 bg-card/35 p-3">
          <label className="text-[10px] font-medium text-muted-foreground">Funil comercial
            <select value={effectiveFunnelId || ""} onChange={(event) => { setSelectedFunnelId(Number(event.target.value)); setSelectedBusiness(null); setCreateStageId(null); }} disabled={funnelsLoading || funnels.length === 0} className="ml-3 h-9 min-w-64 rounded-lg border border-border/30 bg-background/60 px-3 text-[11px] text-foreground outline-none">
              <option value="">Selecione um funil</option>
              {funnels.map((funnel) => <option key={funnel.id} value={funnel.id}>{funnel.nome} · {funnel.estrategia}</option>)}
            </select>
          </label>
          {board && <span className="text-[10px] text-muted-foreground/50">{board.etapas.length} etapas configuradas</span>}
        </div>

        {view === "pipeline" && <><div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border/25 bg-card/45 p-4"><p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Negócios ativos</p><p className="mt-1 text-xl font-bold">{openBusinesses.length}</p></div><div className="rounded-xl border border-border/25 bg-card/45 p-4"><p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground/50"><CircleDollarSign className="h-3 w-3" />Pipeline estimado</p><p className="mt-1 text-xl font-bold">{formatCurrency(pipelineValue)}</p></div><div className="rounded-xl border border-border/25 bg-card/45 p-4"><p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground/50"><Trophy className="h-3 w-3" />Ganhos</p><p className="mt-1 text-xl font-bold text-emerald-500">{allBusinesses.filter((item) => item.resultado === "GANHO").length}</p></div></div>{isLoading ? <div className="py-20 text-center text-sm text-muted-foreground">Carregando pipeline...</div> : error ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar o Pipeline de Vendas.</div> : <PipelineKanbanBoard etapas={filteredStages} canMove={can(commercialPermissions.move) && !moveBusiness.isPending} canCreate={can(commercialPermissions.create)} movingBusinessId={moveBusiness.isPending ? moveBusiness.variables?.id : undefined} onOpen={setSelectedBusiness} onAdd={setCreateStageId} onMove={move} />}</>}

        {view === "tarefas" && <PipelineTarefasVisao funilId={effectiveFunnelId} negocios={allBusinesses} usuarios={users} canView={can(commercialPermissions.taskView)} canConclude={can(commercialPermissions.taskConclude)} onOpenNegocio={setSelectedBusiness} />}
      </section>

      <AnimatePresence>{(selectedBusiness || createStageId) && <PipelineNegocioDialog negocio={selectedBusiness} initialEtapaId={createStageId || undefined} initialResponsavelId={userId} etapas={board?.etapas || []} empresas={companies} usuarios={users} motivosPerda={lossReasons} canEdit={can(commercialPermissions.edit)} canConclude={can(commercialPermissions.conclude)} canConvert={can(commercialPermissions.convert)} canViewTasks={can(commercialPermissions.taskView)} canCreateTask={can(commercialPermissions.taskCreate)} canEditTask={can(commercialPermissions.taskEdit)} canConcludeTask={can(commercialPermissions.taskConclude)} canViewComments={can(commercialPermissions.commentView)} canCreateComment={can(commercialPermissions.commentCreate)} canViewHistory={can(commercialPermissions.historyView)} isProcessing={isProcessing} onClose={closeDialog} onSave={(data) => void saveBusiness(data)} onConclude={(result, motivoId, observacao) => void conclude(result, motivoId, observacao)} onReactivate={() => void reactivate()} onConvert={(companyId) => void convert(companyId)} onOpenContract={() => navigate("/contratos")} />}</AnimatePresence>
      {pendingLoss && <PipelinePerdaDialog empresa={pendingLoss.business.nomeEmpresa} motivos={lossReasons} isProcessing={moveBusiness.isPending} onCancel={() => setPendingLoss(null)} onConfirm={(motivoId, observacao) => void confirmDraggedLoss(motivoId, observacao)} />}
    </PipelineVendasShell>
  );
};

export default PipelineVendas;
