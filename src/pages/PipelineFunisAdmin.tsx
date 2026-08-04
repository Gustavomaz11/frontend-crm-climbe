import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Copy, Pencil, Plus, Settings2, Timer, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PipelineFunilDialog } from "@/components/pipeline/PipelineFunilDialog";
import { PipelineVendasShell } from "@/components/pipeline/PipelineVendasShell";
import {
  useCreatePipelineFunil,
  useDuplicatePipelineFunil,
  usePipelineFunisAdmin,
  useReorderPipelineFunis,
  useUpdatePipelineFunil,
  type PipelineFunil,
  type PipelineFunilInput,
} from "@/services/usePipelineFunis";
import { useUsuarioPermissoes } from "@/services/usePermissoes";
import { useAuthStore } from "@/store/useAuthStore";

const permissions = {
  view: "COMERCIAL_FUNIL_VISUALIZAR",
  create: "COMERCIAL_FUNIL_CRIAR",
  edit: "COMERCIAL_FUNIL_EDITAR",
  duplicate: "COMERCIAL_FUNIL_DUPLICAR",
  reorder: "COMERCIAL_FUNIL_ORDENAR",
} as const;

const PipelineFunisAdmin = () => {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PipelineFunil | null | undefined>(undefined);
  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);
  const userId = basicUserData?.id ?? userData?.id;
  const { data: associations = [], isLoading: permissionsLoading } = useUsuarioPermissoes(userId);
  const permissionCodes = useMemo(() => new Set(associations.map((item) => item.permissao.codigo)), [associations]);
  const can = (permission: string) => permissionCodes.has(permission);
  const { data: funnels = [], isLoading, error } = usePipelineFunisAdmin(can(permissions.view));
  const createFunnel = useCreatePipelineFunil();
  const updateFunnel = useUpdatePipelineFunil();
  const duplicateFunnel = useDuplicatePipelineFunil();
  const reorderFunnels = useReorderPipelineFunis();
  const isProcessing = createFunnel.isPending || updateFunnel.isPending;

  const filteredFunnels = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return funnels;
    return funnels.filter((funnel) => `${funnel.nome} ${funnel.descricao || ""} ${funnel.estrategia}`.toLowerCase().includes(term));
  }, [funnels, search]);

  const save = async (data: PipelineFunilInput) => {
    try {
      if (editing) await updateFunnel.mutateAsync({ id: editing.id, data });
      else await createFunnel.mutateAsync(data);
      toast.success(editing ? "Funil atualizado" : "Funil criado");
      setEditing(undefined);
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Erro ao salvar o funil");
    }
  };

  const duplicate = async (funnel: PipelineFunil) => {
    try {
      await duplicateFunnel.mutateAsync(funnel.id);
      toast.success("Cópia criada como inativa para revisão");
    } catch (duplicateError) {
      toast.error(duplicateError instanceof Error ? duplicateError.message : "Erro ao duplicar o funil");
    }
  };

  const reorder = async (funnelId: number, direction: -1 | 1) => {
    const index = funnels.findIndex((item) => item.id === funnelId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= funnels.length) return;
    const reordered = [...funnels];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    try {
      await reorderFunnels.mutateAsync(reordered.map((item) => item.id));
    } catch (reorderError) {
      toast.error(reorderError instanceof Error ? reorderError.message : "Erro ao alterar a ordem");
    }
  };

  if (!permissionsLoading && !can(permissions.view)) {
    return <PipelineVendasShell search={search} onSearchChange={setSearch} searchPlaceholder="Buscar funis..." activePath="/pipeline-vendas/funis"><div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6"><div className="max-w-md rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"><AlertCircle className="mx-auto h-8 w-8 text-destructive" /><h1 className="mt-4 text-lg font-semibold">Acesso à configuração necessário</h1><p className="mt-2 text-sm text-muted-foreground">Solicite a permissão de visualização de funis comerciais.</p></div></div></PipelineVendasShell>;
  }

  return (
    <PipelineVendasShell search={search} onSearchChange={setSearch} searchPlaceholder="Buscar funis..." activePath="/pipeline-vendas/funis">
      <section className="p-6">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-accent" /><h1 className="text-[22px] font-bold tracking-tight">Configuração de Funis</h1></div><p className="mt-1 text-[12px] text-muted-foreground">Crie processos comerciais completos e defina as regras de cada etapa.</p></div>{can(permissions.create) && <button type="button" onClick={() => setEditing(null)} className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-[12px] font-semibold text-accent-foreground"><Plus className="h-4 w-4" />Novo funil</button>}</header>

        {isLoading || permissionsLoading ? <div className="py-20 text-center text-sm text-muted-foreground">Carregando funis...</div> : error ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar os funis.</div> : <div className="space-y-3">{filteredFunnels.map((funnel, index) => {
          const activeStages = funnel.etapas.filter((stage) => stage.ativo);
          const successStages = funnel.etapas.filter((stage) => stage.sucesso);
          const lossStages = funnel.etapas.filter((stage) => stage.perda);
          return <article key={funnel.id} className="rounded-xl border border-border/25 bg-card/45 p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-[14px] font-semibold">{funnel.nome}</h2><span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${funnel.ativo ? "bg-emerald-500/10 text-emerald-500" : "bg-muted/30 text-muted-foreground"}`}>{funnel.ativo ? "Ativo" : "Inativo"}</span><span className="rounded-full border border-border/25 px-2 py-0.5 text-[9px] text-muted-foreground">{funnel.estrategia}</span></div><p className="mt-1 max-w-3xl text-[10px] text-muted-foreground">{funnel.descricao || "Sem descrição."}</p><div className="mt-3 flex flex-wrap gap-4 text-[9px] text-muted-foreground"><span>{activeStages.length} de {funnel.etapas.length} etapas ativas</span><span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{successStages.map((stage) => stage.nome).join(", ") || "Sem etapa de sucesso"}</span><span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-rose-500" />{lossStages.map((stage) => stage.nome).join(", ") || "Sem etapa de perda"}</span><span className="flex items-center gap-1"><Timer className="h-3 w-3" />{activeStages.filter((stage) => stage.tempoMaximoPermanenciaDias).length} etapa(s) com SLA</span></div></div><div className="flex items-center gap-1">{can(permissions.reorder) && <><button type="button" aria-label="Mover funil para cima" disabled={index === 0 || reorderFunnels.isPending} onClick={() => void reorder(funnel.id, -1)} className="rounded-lg border border-border/25 p-2 text-muted-foreground disabled:opacity-25"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" aria-label="Mover funil para baixo" disabled={index === funnels.length - 1 || reorderFunnels.isPending} onClick={() => void reorder(funnel.id, 1)} className="rounded-lg border border-border/25 p-2 text-muted-foreground disabled:opacity-25"><ArrowDown className="h-3.5 w-3.5" /></button></>}{can(permissions.duplicate) && <button type="button" aria-label="Duplicar funil" disabled={duplicateFunnel.isPending} onClick={() => void duplicate(funnel)} className="rounded-lg border border-border/25 p-2 text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>}{can(permissions.edit) && <button type="button" aria-label="Editar funil" onClick={() => setEditing(funnel)} className="rounded-lg border border-accent/25 bg-accent/5 p-2 text-accent"><Pencil className="h-3.5 w-3.5" /></button>}</div></div></article>;
        })}{filteredFunnels.length === 0 && <div className="rounded-xl border border-dashed border-border/30 py-20 text-center"><Settings2 className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 text-[12px] font-medium">Nenhum funil encontrado</p><p className="mt-1 text-[10px] text-muted-foreground">Crie o primeiro processo comercial ou ajuste a busca.</p></div>}</div>}
      </section>

      <AnimatePresence>{editing !== undefined && <PipelineFunilDialog key={editing?.id || "new"} funil={editing} isProcessing={isProcessing} onClose={() => setEditing(undefined)} onSave={(data) => void save(data)} />}</AnimatePresence>
    </PipelineVendasShell>
  );
};

export default PipelineFunisAdmin;
