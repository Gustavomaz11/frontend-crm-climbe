import { useState } from "react";
import { BriefcaseBusiness, Check, Loader2, LockKeyhole, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useLocation } from "react-router-dom";

import { AppPageShell } from "@/components/layout/AppPageShell";
import { CargoGroupsPanel } from "@/components/cargos/CargoGroupsPanel";
import { CargoHierarchyTree } from "@/components/cargos/CargoHierarchyTree";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useAssignCargoGrupo,
  useCargos,
  useCreateCargo,
  useCreateGrupoCargo,
  useDeleteCargo,
  useDeleteGrupoCargo,
  useGruposCargos,
  useUpdateCargo,
  useUpdateCargoHierarchy,
  useUpdateGrupoCargo,
  useUsuarioPermissoes,
} from "@/services";

export default function Cargos() {
  const { pathname } = useLocation();
  const hierarchyMode = pathname.endsWith("/hierarquia");
  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);
  const userId = basicUserData?.id ?? userData?.id;
  const { data: permissionAssociations = [], isLoading: loadingPermissions } = useUsuarioPermissoes(userId);
  const permissionCodes = new Set(permissionAssociations.map((item) => item.permissao.codigo));
  const canManageCatalog = permissionCodes.has("CARGO_CRUD");
  const canEditHierarchy = permissionCodes.has("CARGO_HIERARQUIA_EDITAR");
  const { data: cargos = [], isLoading } = useCargos();
  const { data: grupos = [], isLoading: loadingGroups } = useGruposCargos();
  const criar = useCreateCargo();
  const atualizar = useUpdateCargo();
  const excluir = useDeleteCargo();
  const criarGrupo = useCreateGrupoCargo();
  const atualizarGrupo = useUpdateGrupoCargo();
  const excluirGrupo = useDeleteGrupoCargo();
  const atribuirGrupo = useAssignCargoGrupo();
  const atualizarHierarquia = useUpdateCargoHierarchy();
  const [novoNome, setNovoNome] = useState("");
  const [novoGrupoId, setNovoGrupoId] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNome, setEditandoNome] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function criarCargo(event: React.FormEvent) {
    event.preventDefault();
    if (!novoNome.trim()) return;
    await criar.mutateAsync({ nome: novoNome.trim(), grupoId: novoGrupoId });
    setNovoNome("");
    setNovoGrupoId(null);
    setFeedback("Cargo criado com sucesso.");
  }

  async function salvarCargo(id: number) {
    if (!editandoNome.trim()) return;
    await atualizar.mutateAsync({ id, nome: editandoNome.trim() });
    setEditandoId(null);
    setFeedback("Cargo atualizado.");
  }

  async function removerCargo(id: number) {
    if (!window.confirm("Desativar este cargo? Usuários que já o possuem não serão alterados.")) return;
    await excluir.mutateAsync(id);
    setFeedback("Cargo desativado.");
  }

  async function salvarHierarquia(items: Parameters<typeof atualizarHierarquia.mutateAsync>[0]) {
    try {
      await atualizarHierarquia.mutateAsync(items);
      setFeedback("Hierarquia atualizada para todos os usuários.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar a hierarquia.");
      throw error;
    }
  }

  const hasAccess = hierarchyMode ? canEditHierarchy : canManageCatalog;

  return (
    <AppPageShell>
      <div className={`mx-auto w-full px-6 py-7 ${hierarchyMode ? "max-w-[1600px]" : "max-w-5xl"}`}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight">{hierarchyMode ? "Hierarquia de cargos" : "Cargos"}</h1>
            <p className="mt-1 text-[12px] text-muted-foreground">{hierarchyMode ? "Organize os níveis e segmentos que definem a visibilidade das tarefas." : "Cadastre e mantenha os cargos disponíveis no sistema."}</p>
          </div>
          {!hierarchyMode && canManageCatalog && <form onSubmit={criarCargo} className="flex flex-wrap gap-2">
            <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do novo cargo" className="h-10 w-64 rounded-lg border border-border/30 bg-card/45 px-3 text-[13px] outline-none focus:border-accent/50" />
            <select value={novoGrupoId ?? ""} onChange={(event) => setNovoGrupoId(event.target.value ? Number(event.target.value) : null)} className="h-10 w-52 rounded-lg border border-border/30 bg-card px-3 text-[12px] outline-none focus:border-accent/50">
              <option value="">Sem grupo</option>
              {grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>)}
            </select>
            <button disabled={criar.isPending || !novoNome.trim()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-[12px] font-semibold text-accent-foreground disabled:opacity-50">
              {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar
            </button>
          </form>}
        </div>

        {feedback && <div className="mb-4 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-3 py-2 text-[12px] text-accent"><Check className="h-4 w-4" />{feedback}</div>}

        {loadingPermissions ? <div className="flex justify-center p-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : !hasAccess ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center"><LockKeyhole className="mx-auto h-7 w-7 text-destructive" /><p className="mt-3 text-sm font-semibold">Você não possui permissão para acessar esta configuração.</p></div> : hierarchyMode ? <CargoHierarchyTree cargos={cargos} isSaving={atualizarHierarquia.isPending} onSave={salvarHierarquia} /> : <>
          <CargoGroupsPanel
            cargos={cargos}
            grupos={grupos}
            isLoading={loadingGroups}
            isProcessing={criarGrupo.isPending || atualizarGrupo.isPending || excluirGrupo.isPending}
            onCreate={criarGrupo.mutateAsync}
            onUpdate={atualizarGrupo.mutateAsync}
            onDelete={excluirGrupo.mutateAsync}
            onFeedback={setFeedback}
          />
          <section className="overflow-hidden rounded-xl border border-border/25 bg-card/45">
          <div className="grid grid-cols-[minmax(0,1fr)_240px_120px] border-b border-border/20 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <span>Cargo</span><span>Grupo</span><span className="text-right">Ações</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center p-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : cargos.length === 0 ? (
            <div className="p-12 text-center text-[12px] text-muted-foreground">Nenhum cargo cadastrado.</div>
          ) : cargos.map((cargo) => (
            <div key={cargo.id} className="grid grid-cols-[minmax(0,1fr)_240px_120px] items-center gap-3 border-b border-border/10 px-5 py-3 last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><BriefcaseBusiness className="h-4 w-4" /></div>
                {editandoId === cargo.id ? (
                  <input autoFocus value={editandoNome} onChange={(e) => setEditandoNome(e.target.value)} className="h-9 w-full max-w-md rounded-lg border border-accent/40 bg-background/50 px-3 text-[13px] outline-none" />
                ) : <span className="text-[13px] font-medium">{cargo.nome}</span>}
              </div>
              <select
                value={cargo.grupoId ?? ""}
                disabled={atribuirGrupo.isPending}
                onChange={(event) => void atribuirGrupo.mutateAsync({ cargoId: cargo.id, grupoId: event.target.value ? Number(event.target.value) : null }).then(() => setFeedback("Grupo do cargo atualizado."))}
                className="h-9 w-full rounded-lg border border-border/30 bg-background/55 px-3 text-[11px] text-foreground outline-none focus:border-accent/50 disabled:opacity-50"
                aria-label={`Grupo de ${cargo.nome}`}
              >
                <option value="">Sem grupo</option>
                {grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>)}
              </select>
              <div className="flex justify-end gap-2">
                {editandoId === cargo.id ? (
                  <>
                    <button type="button" onClick={() => salvarCargo(cargo.id)} className="rounded-lg p-2 text-accent hover:bg-accent/10"><Save className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setEditandoId(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/30"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => { setEditandoId(cargo.id); setEditandoNome(cargo.nome); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/30 hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => removerCargo(cargo.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </section></>}
      </div>
    </AppPageShell>
  );
}
