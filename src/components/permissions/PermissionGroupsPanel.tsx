import { useState } from "react";
import { Layers3, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import {
  type Permissao,
  useCreateGrupoPermissao,
  useDeleteGrupoPermissao,
  useGruposPermissoes,
  useUpdateGrupoPermissao,
} from "@/services";

interface PermissionGroupsPanelProps {
  permissoes: Permissao[];
}

export function PermissionGroupsPanel({ permissoes }: PermissionGroupsPanelProps) {
  const { data: grupos = [], isLoading } = useGruposPermissoes();
  const criar = useCreateGrupoPermissao();
  const atualizar = useUpdateGrupoPermissao();
  const excluir = useDeleteGrupoPermissao();
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());

  const fecharFormulario = () => {
    setAberto(false);
    setEditandoId(null);
    setNome("");
    setDescricao("");
    setSelecionadas(new Set());
  };

  const iniciarCriacao = () => {
    fecharFormulario();
    setAberto(true);
  };

  const iniciarEdicao = (grupoId: number) => {
    const grupo = grupos.find((item) => item.id === grupoId);
    if (!grupo) return;

    setEditandoId(grupo.id);
    setNome(grupo.nome);
    setDescricao(grupo.descricao);
    setSelecionadas(new Set(grupo.permissoes.map((permissao) => permissao.id)));
    setAberto(true);
  };

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    if (!nome.trim() || selecionadas.size === 0) return;

    const data = {
      nome: nome.trim(),
      descricao: descricao.trim(),
      permissaoIds: [...selecionadas],
    };

    if (editandoId) {
      await atualizar.mutateAsync({ id: editandoId, data });
    } else {
      await criar.mutateAsync(data);
    }
    fecharFormulario();
  }

  const isSaving = criar.isPending || atualizar.isPending;

  return (
    <section className="rounded-xl border border-border/25 bg-card/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Layers3 className="h-4 w-4" /></div>
          <div><h2 className="text-[14px] font-semibold">Grupos de permissões</h2><p className="text-[10px] text-muted-foreground">Modelos reutilizáveis para aprovar novos usuários.</p></div>
        </div>
        <button type="button" onClick={iniciarCriacao} className="inline-flex h-9 items-center gap-2 rounded-lg border border-accent/25 bg-accent/10 px-3 text-[11px] font-medium text-accent"><Plus className="h-4 w-4" />Novo grupo</button>
      </div>

      {aberto && (
        <form onSubmit={salvar} className="mt-4 rounded-xl border border-border/20 bg-background/35 p-4">
          <h3 className="mb-3 text-[12px] font-semibold">
            {editandoId ? "Editar grupo de permissões" : "Criar grupo de permissões"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do grupo" className="h-9 rounded-lg border border-border/30 bg-background/55 px-3 text-[12px] outline-none focus:border-accent/50" />
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" className="h-9 rounded-lg border border-border/30 bg-background/55 px-3 text-[12px] outline-none focus:border-accent/50" />
          </div>
          <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
            {permissoes.map((permissao) => (
              <label key={permissao.id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/15 p-2.5 text-[11px] hover:bg-muted/20">
                <input
                  type="checkbox"
                  checked={selecionadas.has(permissao.id)}
                  onChange={() =>
                    setSelecionadas((current) => {
                      const next = new Set(current);
                      if (next.has(permissao.id)) next.delete(permissao.id);
                      else next.add(permissao.id);
                      return next;
                    })
                  }
                  className="mt-0.5 accent-[hsl(var(--accent))]"
                />
                <span><strong className="block font-medium">{permissao.nome}</strong><small className="text-muted-foreground">{permissao.codigo}</small></span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={fecharFormulario} className="h-9 rounded-lg border border-border/25 px-3 text-[11px]">Cancelar</button>
            <button disabled={isSaving || !nome.trim() || selecionadas.size === 0} className="h-9 rounded-lg bg-accent px-4 text-[11px] font-semibold text-accent-foreground disabled:opacity-50">
              {isSaving ? "Salvando..." : editandoId ? "Salvar alterações" : "Criar grupo"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : grupos.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Nenhum grupo criado.</p>
        ) : grupos.map((grupo) => (
          <article key={grupo.id} className="rounded-lg border border-border/20 bg-background/40 p-3">
            <div className="flex items-start justify-between gap-2">
              <div><h3 className="text-[12px] font-semibold">{grupo.nome}</h3><p className="mt-0.5 text-[10px] text-muted-foreground">{grupo.descricao || `${grupo.permissoes.length} permissões`}</p></div>
              <div className="flex gap-1">
                <button type="button" title="Editar grupo" onClick={() => iniciarEdicao(grupo.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent/10 hover:text-accent"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" title="Excluir grupo" onClick={() => window.confirm("Excluir este grupo?") && excluir.mutate(grupo.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-accent">{grupo.permissoes.length} permissões configuradas</p>
          </article>
        ))}
      </div>
    </section>
  );
}
