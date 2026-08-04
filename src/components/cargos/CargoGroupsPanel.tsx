import { useState } from "react";
import { FolderKanban, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import type { Cargo, GrupoCargo } from "@/services";

interface CargoGroupsPanelProps {
  cargos: Cargo[];
  grupos: GrupoCargo[];
  isLoading: boolean;
  isProcessing: boolean;
  onCreate: (data: { nome: string; descricao?: string | null }) => Promise<unknown>;
  onUpdate: (data: { id: number; nome: string; descricao?: string | null }) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
  onFeedback: (message: string) => void;
}

export function CargoGroupsPanel({
  cargos,
  grupos,
  isLoading,
  isProcessing,
  onCreate,
  onUpdate,
  onDelete,
  onFeedback,
}: CargoGroupsPanelProps) {
  const [novoNome, setNovoNome] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNome, setEditandoNome] = useState("");
  const [editandoDescricao, setEditandoDescricao] = useState("");

  async function criarGrupo(event: React.FormEvent) {
    event.preventDefault();
    if (!novoNome.trim()) return;
    await onCreate({ nome: novoNome.trim(), descricao: novaDescricao.trim() || null });
    setNovoNome("");
    setNovaDescricao("");
    onFeedback("Grupo de cargos criado com sucesso.");
  }

  function iniciarEdicao(grupo: GrupoCargo) {
    setEditandoId(grupo.id);
    setEditandoNome(grupo.nome);
    setEditandoDescricao(grupo.descricao ?? "");
  }

  async function salvarGrupo() {
    if (editandoId === null || !editandoNome.trim()) return;
    await onUpdate({
      id: editandoId,
      nome: editandoNome.trim(),
      descricao: editandoDescricao.trim() || null,
    });
    setEditandoId(null);
    onFeedback("Grupo de cargos atualizado.");
  }

  async function removerGrupo(grupo: GrupoCargo) {
    const quantidade = cargos.filter((cargo) => cargo.grupoId === grupo.id).length;
    const complemento = quantidade > 0
      ? ` Os ${quantidade} cargo(s) vinculados ficarão sem grupo.`
      : "";
    if (!window.confirm(`Desativar o grupo “${grupo.nome}”?${complemento}`)) return;
    await onDelete(grupo.id);
    onFeedback("Grupo desativado. Nenhum cargo foi excluído.");
  }

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-border/30 bg-card/55">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/20 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-accent" />
            <h2 className="text-[14px] font-semibold">Grupos de cargos</h2>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Organize o catálogo por área ou segmento sem alterar a hierarquia.
          </p>
        </div>
        <form onSubmit={criarGrupo} className="grid w-full gap-2 sm:w-auto sm:grid-cols-[190px_250px_auto]">
          <input
            value={novoNome}
            onChange={(event) => setNovoNome(event.target.value)}
            placeholder="Nome do grupo"
            maxLength={120}
            className="h-10 rounded-lg border border-border/35 bg-background/55 px-3 text-[12px] outline-none focus:border-accent/60"
          />
          <input
            value={novaDescricao}
            onChange={(event) => setNovaDescricao(event.target.value)}
            placeholder="Descrição (opcional)"
            maxLength={500}
            className="h-10 rounded-lg border border-border/35 bg-background/55 px-3 text-[12px] outline-none focus:border-accent/60"
          />
          <button
            disabled={isProcessing || !novoNome.trim()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/15 px-4 text-[12px] font-semibold text-accent hover:bg-accent/25 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar grupo
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : grupos.length === 0 ? (
        <div className="px-5 py-7 text-center text-[12px] text-muted-foreground">
          Nenhum grupo criado. Os cargos continuam disponíveis em “Sem grupo”.
        </div>
      ) : (
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {grupos.map((grupo) => {
            const quantidade = cargos.filter((cargo) => cargo.grupoId === grupo.id).length;
            const editing = editandoId === grupo.id;
            return (
              <article key={grupo.id} className="rounded-lg border border-border/25 bg-background/30 p-4">
                {editing ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={editandoNome}
                      onChange={(event) => setEditandoNome(event.target.value)}
                      maxLength={120}
                      className="h-9 w-full rounded-lg border border-accent/45 bg-background/60 px-3 text-[12px] outline-none"
                    />
                    <input
                      value={editandoDescricao}
                      onChange={(event) => setEditandoDescricao(event.target.value)}
                      maxLength={500}
                      placeholder="Descrição (opcional)"
                      className="h-9 w-full rounded-lg border border-border/35 bg-background/60 px-3 text-[12px] outline-none focus:border-accent/45"
                    />
                  </div>
                ) : (
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold">{grupo.nome}</span>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        {quantidade} {quantidade === 1 ? "cargo" : "cargos"}
                      </span>
                    </div>
                    <p className="mt-1 min-h-4 truncate text-[11px] text-muted-foreground">
                      {grupo.descricao || "Sem descrição"}
                    </p>
                  </div>
                )}
                <div className="mt-3 flex justify-end gap-1 border-t border-border/15 pt-2">
                  {editing ? (
                    <>
                      <button type="button" disabled={isProcessing || !editandoNome.trim()} onClick={() => void salvarGrupo()} className="rounded-lg p-2 text-accent hover:bg-accent/10 disabled:opacity-40" aria-label="Salvar grupo"><Save className="h-4 w-4" /></button>
                      <button type="button" disabled={isProcessing} onClick={() => setEditandoId(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/30" aria-label="Cancelar edição"><X className="h-4 w-4" /></button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => iniciarEdicao(grupo)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/30 hover:text-foreground" aria-label={`Editar ${grupo.nome}`}><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => void removerGrupo(grupo)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Excluir ${grupo.nome}`}><Trash2 className="h-4 w-4" /></button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
