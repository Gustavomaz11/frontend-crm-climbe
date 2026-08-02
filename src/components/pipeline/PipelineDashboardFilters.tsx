import { RotateCcw } from "lucide-react";
import type { Empresa } from "@/services/useEmpresas";
import type { PipelineFunilResumo } from "@/services/usePipelineFunis";
import type { PipelineDashboard, PipelineDashboardFilters } from "@/services/usePipelineDashboard";
import type { Usuario } from "@/services/useUsuarios";
import { UserSelect } from "@/components/users/UserSelect";

interface Props {
  value: PipelineDashboardFilters;
  options?: PipelineDashboard["opcoes"];
  users: Usuario[];
  funnels: PipelineFunilResumo[];
  companies: Empresa[];
  onChange: (value: PipelineDashboardFilters) => void;
}

export const PipelineDashboardFilterBar = ({ value, options, users, funnels, companies, onChange }: Props) => {
  const field = (key: keyof PipelineDashboardFilters, next: string) => onChange({
    ...value,
    [key]: ["responsavelId", "funilId", "empresaId"].includes(key) ? (next ? Number(next) : undefined) : next || undefined,
  });
  const selectClass = "h-9 rounded-lg border border-border/25 bg-background/60 px-2 text-[10px] outline-none";
  return <div className="mb-5 grid gap-2 rounded-xl border border-border/25 bg-card/40 p-3 sm:grid-cols-2 lg:grid-cols-5">
    <input type="date" aria-label="Data inicial" value={value.dataInicio || ""} onChange={(event) => field("dataInicio", event.target.value)} className={selectClass} />
    <input type="date" aria-label="Data final" value={value.dataFim || ""} onChange={(event) => field("dataFim", event.target.value)} className={selectClass} />
    <UserSelect users={users} value={value.responsavelId || ""} onValueChange={(next) => field("responsavelId", next)} placeholder="Todos responsáveis" emptyLabel="Todos responsáveis" ariaLabel="Filtrar por responsável" className="h-10" />
    <select value={value.funilId || ""} onChange={(event) => field("funilId", event.target.value)} className={selectClass}><option value="">Todos os funis</option>{funnels.map((funil) => <option key={funil.id} value={funil.id}>{funil.nome}</option>)}</select>
    <select value={value.estrategia || ""} onChange={(event) => field("estrategia", event.target.value)} className={selectClass}><option value="">Todas estratégias</option>{options?.estrategias.map((item) => <option key={item}>{item}</option>)}</select>
    <select value={value.servico || ""} onChange={(event) => field("servico", event.target.value)} className={selectClass}><option value="">Todos os serviços</option>{options?.servicos.map((item) => <option key={item}>{item}</option>)}</select>
    <select value={value.origem || ""} onChange={(event) => field("origem", event.target.value)} className={selectClass}><option value="">Todas as origens</option>{options?.origens.map((item) => <option key={item}>{item}</option>)}</select>
    <select value={value.empresaId || ""} onChange={(event) => field("empresaId", event.target.value)} className={selectClass}><option value="">Todas as empresas</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.nome}</option>)}</select>
    <select value={value.situacao || ""} onChange={(event) => field("situacao", event.target.value)} className={selectClass}><option value="">Todas as situações</option><option value="ABERTO">Abertos</option><option value="GANHO">Ganhos</option><option value="PERDIDO">Perdidos</option></select>
    <button type="button" onClick={() => onChange({})} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-border/25 text-[10px] text-muted-foreground hover:bg-muted"><RotateCcw className="h-3.5 w-3.5" />Limpar filtros</button>
  </div>;
};
