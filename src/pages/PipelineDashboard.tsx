import { useMemo, useState } from "react";
import { AlertCircle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PipelineCancelamentosRelatorio } from "@/components/pipeline/PipelineCancelamentosRelatorio";
import { useCampanhasOpcoes } from "@/services/usePipelineCadastros";
import { PipelineDashboardBreakdowns } from "@/components/pipeline/PipelineDashboardBreakdowns";
import { PipelineDashboardFilterBar } from "@/components/pipeline/PipelineDashboardFilters";
import { PipelineDashboardSummary } from "@/components/pipeline/PipelineDashboardSummary";
import { PipelineVendasShell } from "@/components/pipeline/PipelineVendasShell";
import { useEmpresas } from "@/services/useEmpresas";
import { usePipelineDashboard, type PipelineDashboardFilters } from "@/services/usePipelineDashboard";
import { usePipelineFunisAtivos } from "@/services/usePipelineFunis";
import { useUsuarioPermissoes } from "@/services/usePermissoes";
import { useUsuarios } from "@/services/useUsuarios";
import { useAuthStore } from "@/store/useAuthStore";

const PipelineDashboard = () => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<PipelineDashboardFilters>({});
  const navigate = useNavigate();
  const { data: campanhas = [] } = useCampanhasOpcoes();
  const basic = useAuthStore((state) => state.basicUserData);
  const user = useAuthStore((state) => state.userData);
  const { data: associations = [], isLoading: permissionsLoading } = useUsuarioPermissoes(basic?.id ?? user?.id);
  const permissions = useMemo(() => new Set(associations.map((item) => item.permissao.codigo)), [associations]);
  const { data, isLoading, error } = usePipelineDashboard(filters);
  const { data: users = [] } = useUsuarios();
  const { data: funnels = [] } = usePipelineFunisAtivos();
  const { data: companies = [] } = useEmpresas();

  if (!permissionsLoading && !permissions.has("COMERCIAL_DASHBOARD_VISUALIZAR")) return <PipelineVendasShell search={search} onSearchChange={setSearch} activePath="/pipeline-vendas/dashboard"><div className="flex min-h-[calc(100vh-64px)] items-center justify-center"><div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"><AlertCircle className="mx-auto text-destructive" /><p className="mt-3 text-sm">Sem permissão para visualizar o dashboard comercial.</p></div></div></PipelineVendasShell>;

  return <PipelineVendasShell search={search} onSearchChange={setSearch} searchPlaceholder="Buscar indicadores..." activePath="/pipeline-vendas/dashboard">
    <section className="p-6">
      <div className="mb-5"><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-accent" /><h1 className="text-xl font-bold">Dashboard Comercial</h1></div><p className="mt-1 text-xs text-muted-foreground">Acompanhe conversão, valores e negociações que precisam de atenção.</p></div>
      <p className="mb-3 text-xs text-muted-foreground">Sem seleção de funil, os indicadores consideram somente vendas. Selecione Pré-vendas para acompanhar a qualificação de leads.</p>
      <label className="mb-3 block text-xs">Campanha de origem <select className="ml-2 rounded border bg-background p-2" value={filters.campanhaId || ""} onChange={e => setFilters(current => ({ ...current, campanhaId: e.target.value ? Number(e.target.value) : undefined }))}><option value="">Todas as campanhas</option>{campanhas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
      <PipelineDashboardFilterBar value={filters} options={data?.opcoes} users={users} funnels={funnels} companies={companies} onChange={setFilters} />
      {isLoading || permissionsLoading ? <p className="py-20 text-center text-sm text-muted-foreground">Calculando indicadores...</p> : error || !data ? <p className="rounded-xl bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar o dashboard comercial.</p> : <><PipelineDashboardSummary summary={data.resumo} /><PipelineDashboardBreakdowns data={data} onOpenBusiness={() => navigate("/pipeline-vendas")} /></>}
      {permissions.has("COMERCIAL_DASHBOARD_VISUALIZAR") && <PipelineCancelamentosRelatorio />}
    </section>
  </PipelineVendasShell>;
};

export default PipelineDashboard;
