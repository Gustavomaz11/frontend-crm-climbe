import { useMemo, useState } from "react";
import { AlertCircle, Edit3, Plus, Target, X } from "lucide-react";
import { toast } from "sonner";
import { PipelineVendasShell } from "@/components/pipeline/PipelineVendasShell";
import { useUsuarioPermissoes } from "@/services/usePermissoes";
import {
  useCreatePipelineMotivoPerda,
  usePipelineMotivosPerdaAdmin,
  useUpdatePipelineMotivoPerda,
  type PipelineMotivoPerda,
  type PipelineMotivoPerdaInput,
} from "@/services/usePipelineMotivosPerda";
import { useAuthStore } from "@/store/useAuthStore";

const permissions = {
  view: "COMERCIAL_MOTIVO_PERDA_VISUALIZAR",
  create: "COMERCIAL_MOTIVO_PERDA_CRIAR",
  edit: "COMERCIAL_MOTIVO_PERDA_EDITAR",
};

const emptyDraft: PipelineMotivoPerdaInput = { nome: "", descricao: "", ativo: true };

const PipelineMotivosPerdaAdmin = () => {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PipelineMotivoPerda | null | undefined>();
  const [draft, setDraft] = useState(emptyDraft);
  const basic = useAuthStore((state) => state.basicUserData);
  const user = useAuthStore((state) => state.userData);
  const { data: associations = [], isLoading: loadingPermissions } = useUsuarioPermissoes(basic?.id ?? user?.id);
  const codes = useMemo(() => new Set(associations.map((item) => item.permissao.codigo)), [associations]);
  const { data: reasons = [], isLoading, error } = usePipelineMotivosPerdaAdmin();
  const createReason = useCreatePipelineMotivoPerda();
  const updateReason = useUpdatePipelineMotivoPerda();
  const filtered = reasons.filter((reason) => `${reason.nome} ${reason.descricao || ""}`.toLowerCase().includes(search.toLowerCase()));

  const open = (reason?: PipelineMotivoPerda) => {
    setEditing(reason ?? null);
    setDraft(reason ? { nome: reason.nome, descricao: reason.descricao, ativo: reason.ativo } : emptyDraft);
  };

  const save = async () => {
    try {
      if (editing) await updateReason.mutateAsync({ id: editing.id, data: draft });
      else await createReason.mutateAsync(draft);
      toast.success(editing ? "Motivo atualizado" : "Motivo criado");
      setEditing(undefined);
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Erro ao salvar motivo");
    }
  };

  if (!loadingPermissions && !codes.has(permissions.view)) return <PipelineVendasShell search={search} onSearchChange={setSearch} activePath="/pipeline-vendas/motivos-perda"><div className="flex min-h-[calc(100vh-64px)] items-center justify-center"><div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"><AlertCircle className="mx-auto text-destructive" /><p className="mt-3 text-sm">Sem permissão para visualizar motivos de perda.</p></div></div></PipelineVendasShell>;

  return <PipelineVendasShell search={search} onSearchChange={setSearch} searchPlaceholder="Buscar motivos..." activePath="/pipeline-vendas/motivos-perda">
    <section className="p-6">
      <div className="mb-6 flex items-start justify-between"><div><div className="flex items-center gap-2"><Target className="h-5 w-5 text-accent" /><h1 className="text-xl font-bold">Motivos de Perda</h1></div><p className="mt-1 text-xs text-muted-foreground">Padronize os motivos utilizados na análise comercial.</p></div>{codes.has(permissions.create) && <button type="button" onClick={() => open()} className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-semibold text-accent-foreground"><Plus className="h-4 w-4" />Novo motivo</button>}</div>
      {isLoading || loadingPermissions ? <p className="py-20 text-center text-sm text-muted-foreground">Carregando...</p> : error ? <p className="rounded-xl bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar os motivos.</p> : <div className="grid gap-3 lg:grid-cols-2">{filtered.map((reason) => <article key={reason.id} className="flex items-start justify-between rounded-xl border border-border/25 bg-card/45 p-4"><div><div className="flex items-center gap-2"><h2 className="text-sm font-semibold">{reason.nome}</h2><span className={`rounded-full px-2 py-0.5 text-[9px] ${reason.ativo ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{reason.ativo ? "Ativo" : "Inativo"}</span></div><p className="mt-1 text-[11px] text-muted-foreground">{reason.descricao || "Sem descrição"}</p></div>{codes.has(permissions.edit) && <button type="button" onClick={() => open(reason)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><Edit3 className="h-4 w-4" /></button>}</article>)}</div>}
    </section>
    {editing !== undefined && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Fechar" onClick={() => setEditing(undefined)} className="absolute inset-0 bg-black/50" /><section className="relative w-full max-w-lg rounded-2xl border border-border/30 bg-card p-6 shadow-2xl"><div className="flex justify-between"><h2 className="font-semibold">{editing ? "Editar motivo" : "Novo motivo"}</h2><button type="button" onClick={() => setEditing(undefined)}><X className="h-4 w-4" /></button></div><label className="mt-5 block text-xs">Nome<input value={draft.nome} onChange={(event) => setDraft({ ...draft, nome: event.target.value })} maxLength={120} className="mt-2 h-10 w-full rounded-lg border border-border/30 bg-background px-3 outline-none" /></label><label className="mt-4 block text-xs">Descrição<textarea value={draft.descricao || ""} onChange={(event) => setDraft({ ...draft, descricao: event.target.value })} rows={3} className="mt-2 w-full rounded-lg border border-border/30 bg-background p-3 outline-none" /></label><label className="mt-4 flex items-center gap-2 text-xs"><input type="checkbox" checked={draft.ativo} onChange={(event) => setDraft({ ...draft, ativo: event.target.checked })} />Motivo ativo</label><div className="mt-5 flex justify-end"><button type="button" onClick={() => void save()} disabled={!draft.nome.trim() || createReason.isPending || updateReason.isPending} className="h-9 rounded-lg bg-accent px-4 text-xs font-semibold text-accent-foreground disabled:opacity-50">Salvar</button></div></section></div>}
  </PipelineVendasShell>;
};

export default PipelineMotivosPerdaAdmin;
