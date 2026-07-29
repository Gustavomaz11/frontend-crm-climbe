import { useMemo, useState } from "react";
import { AlertCircle, Edit3, FileCode2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PipelineScriptDialog } from "@/components/pipeline/PipelineScriptDialog";
import { PipelineVendasShell } from "@/components/pipeline/PipelineVendasShell";
import { useUsuarioPermissoes } from "@/services/usePermissoes";
import { useCreatePipelineScript, usePipelineScriptPerformance, usePipelineScripts, useUpdatePipelineScript, type PipelineScript, type PipelineScriptInput } from "@/services/usePipelineScripts";
import { useAuthStore } from "@/store/useAuthStore";

const Performance = ({ id }: { id: number }) => {
  const { data } = usePipelineScriptPerformance(id);
  return <div className="mt-3 flex gap-4 text-[9px] text-muted-foreground"><span>{data?.tarefasGeradas || 0} usos</span><span>{data?.tarefasConcluidas || 0} concluídos</span><strong className="text-accent">{data?.taxaConclusao || 0}%</strong></div>;
};

const PipelineScripts = () => {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PipelineScript | null | undefined>();
  const basic = useAuthStore((state) => state.basicUserData); const user = useAuthStore((state) => state.userData);
  const { data: associations = [], isLoading: loadingPermissions } = useUsuarioPermissoes(basic?.id ?? user?.id);
  const codes = useMemo(() => new Set(associations.map((item) => item.permissao.codigo)), [associations]);
  const { data: scripts = [], isLoading, error } = usePipelineScripts();
  const create = useCreatePipelineScript(); const update = useUpdatePipelineScript();
  const filtered = scripts.filter((item) => `${item.nome} ${item.categoria} ${item.canal}`.toLowerCase().includes(search.toLowerCase()));
  const save = async (data: PipelineScriptInput) => { try { if (editing) await update.mutateAsync({ id: editing.id, data }); else await create.mutateAsync(data); toast.success(editing ? "Script atualizado" : "Script criado"); setEditing(undefined); } catch (saveError) { toast.error(saveError instanceof Error ? saveError.message : "Erro ao salvar script"); } };

  if (!loadingPermissions && !codes.has("COMERCIAL_SCRIPT_VISUALIZAR")) return <PipelineVendasShell search={search} onSearchChange={setSearch} activePath="/pipeline-vendas/scripts"><div className="flex min-h-[calc(100vh-64px)] items-center justify-center"><AlertCircle className="text-destructive" /></div></PipelineVendasShell>;
  return <PipelineVendasShell search={search} onSearchChange={setSearch} searchPlaceholder="Buscar scripts..." activePath="/pipeline-vendas/scripts"><section className="p-6"><div className="mb-6 flex justify-between"><div><div className="flex items-center gap-2"><FileCode2 className="h-5 w-5 text-accent" /><h1 className="text-xl font-bold">Biblioteca de Scripts</h1></div><p className="mt-1 text-xs text-muted-foreground">Mensagens personalizadas para campanhas e tarefas.</p></div>{codes.has("COMERCIAL_SCRIPT_CRIAR") && <button type="button" onClick={() => setEditing(null)} className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-semibold text-accent-foreground"><Plus className="h-4 w-4" />Novo script</button>}</div>{isLoading ? <p className="py-20 text-center text-sm">Carregando...</p> : error ? <p className="text-destructive">Não foi possível carregar os scripts.</p> : <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{filtered.map((script) => <article key={script.id} className="rounded-xl border border-border/25 bg-card/45 p-4"><div className="flex justify-between"><div><div className="flex gap-2"><h2 className="text-sm font-semibold">{script.nome}</h2><span className={`rounded-full px-2 py-0.5 text-[8px] ${script.ativo ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{script.ativo ? "Ativo" : "Inativo"}</span></div><p className="mt-1 text-[10px] text-muted-foreground">{script.categoria} · {script.canal}</p></div>{codes.has("COMERCIAL_SCRIPT_EDITAR") && <button type="button" onClick={() => setEditing(script)}><Edit3 className="h-4 w-4 text-muted-foreground" /></button>}</div><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-[10px] text-muted-foreground">{script.modeloMensagem}</p><Performance id={script.id} /></article>)}</div>}</section>{editing !== undefined && <PipelineScriptDialog script={editing} processing={create.isPending || update.isPending} onClose={() => setEditing(undefined)} onSave={(data) => void save(data)} />}</PipelineVendasShell>;
};

export default PipelineScripts;
