import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Crown, Loader2, RotateCcw, Save, UsersRound } from "lucide-react";

import type { Cargo } from "@/services";
import {
  buildCargoHierarchy,
  getCargoDescendantIds,
  moveCargoAmongSiblings,
  reparentCargo,
  serializeCargoHierarchy,
  type CargoHierarchyNode,
} from "./cargoHierarchyModel";

interface CargoHierarchyTreeProps {
  cargos: Cargo[];
  isSaving: boolean;
  onSave: (cargos: ReturnType<typeof serializeCargoHierarchy>) => Promise<void>;
}

interface HierarchyBranchProps {
  node: CargoHierarchyNode;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const HierarchyBranch = ({ node, selectedId, onSelect }: HierarchyBranchProps) => (
  <div className="flex flex-col items-center">
    <motion.button
      layout
      type="button"
      onClick={() => onSelect(node.id)}
      className={`group min-h-20 w-52 rounded-xl border px-4 py-3 text-left shadow-sm transition-colors ${selectedId === node.id ? "border-accent/60 bg-accent/12 ring-2 ring-accent/10" : "border-border/30 bg-card/90 hover:border-accent/35 hover:bg-card"}`}
    >
      <span className="mb-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/45">
        <UsersRound className="h-3.5 w-3.5" />Cargo
      </span>
      <span className="block text-[12px] font-semibold leading-snug text-foreground">{node.nome}</span>
      <span className="mt-1 block text-[9px] text-muted-foreground/45">{node.children.length} subordinado(s) direto(s)</span>
    </motion.button>
    {node.children.length > 0 && (
      <>
        <div className="h-6 border-l border-accent/35" />
        <div className="flex border-t border-accent/35">
          {node.children.map((child) => (
            <div key={child.id} className="relative px-3 pt-6 before:absolute before:left-1/2 before:top-0 before:h-6 before:border-l before:border-accent/35">
              <HierarchyBranch node={child} selectedId={selectedId} onSelect={onSelect} />
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

export const CargoHierarchyTree = ({ cargos, isSaving, onSave }: CargoHierarchyTreeProps) => {
  const [draft, setDraft] = useState<Cargo[]>(cargos);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const roots = useMemo(() => buildCargoHierarchy(draft), [draft]);
  const selected = draft.find((cargo) => cargo.id === selectedId) ?? null;
  const invalidParentIds = selected ? getCargoDescendantIds(draft, selected.id) : new Set<number>();

  useEffect(() => {
    if (dirty) return;
    setDraft(cargos);
  }, [cargos, dirty]);

  const updateParent = (parentId: number | null) => {
    if (!selected) return;
    setDraft((current) => reparentCargo(current, selected.id, parentId));
    setDirty(true);
  };

  const move = (direction: -1 | 1) => {
    if (!selected) return;
    setDraft((current) => moveCargoAmongSiblings(current, selected.id, direction));
    setDirty(true);
  };

  const reset = () => {
    setDraft(cargos);
    setSelectedId(null);
    setDirty(false);
  };

  const save = async () => {
    await onSave(serializeCargoHierarchy(draft));
    setDirty(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/25 bg-card/45 p-4">
        <div>
          <h2 className="text-[14px] font-semibold">Estrutura organizacional</h2>
          <p className="mt-1 text-[10px] text-muted-foreground/55">Selecione um cargo para definir o superior direto ou ajustar sua posição entre cargos do mesmo nível.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={reset} disabled={!dirty || isSaving} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/30 px-3 text-[11px] text-muted-foreground disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />Desfazer</button>
          <button type="button" onClick={() => void save()} disabled={!dirty || isSaving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[11px] font-semibold text-accent-foreground disabled:opacity-40">{isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Salvar hierarquia</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-h-[520px] overflow-auto rounded-2xl border border-border/25 bg-[radial-gradient(circle_at_top,hsl(var(--accent)/0.08),transparent_45%)] p-8">
          <div className="flex min-w-max flex-col items-center">
            <div className="flex min-h-24 w-60 flex-col justify-center rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4 text-center shadow-lg shadow-accent/5">
              <Crown className="mx-auto mb-2 h-5 w-5 text-accent" />
              <p className="text-[14px] font-bold">Administrador</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">Raiz fixa da organização</p>
            </div>
            {roots.length > 0 ? (
              <>
                <div className="h-8 border-l border-accent/45" />
                <div className="flex border-t border-accent/45">
                  {roots.map((root) => (
                    <div key={root.id} className="relative px-3 pt-8 before:absolute before:left-1/2 before:top-0 before:h-8 before:border-l before:border-accent/45">
                      <HierarchyBranch node={root} selectedId={selectedId} onSelect={setSelectedId} />
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="mt-10 text-[11px] text-muted-foreground/50">Cadastre cargos para começar a estrutura.</p>}
          </div>
        </section>

        <aside className="h-fit rounded-xl border border-border/25 bg-card/55 p-4 xl:sticky xl:top-5">
          {selected ? (
            <div className="space-y-4">
              <div><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-accent">Cargo selecionado</p><h3 className="mt-1 text-[14px] font-semibold leading-snug">{selected.nome}</h3></div>
              <label className="block"><span className="mb-1.5 block text-[10px] font-medium text-muted-foreground">Superior direto</span><select value={selected.cargoSuperiorId ?? ""} onChange={(event) => updateParent(event.target.value ? Number(event.target.value) : null)} className="h-10 w-full rounded-lg border border-border/30 bg-background/55 px-3 text-[11px] outline-none focus:border-accent/50"><option value="">Administrador</option>{draft.filter((cargo) => cargo.id !== selected.id && !invalidParentIds.has(cargo.id)).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((cargo) => <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>)}</select></label>
              <div><p className="mb-1.5 text-[10px] font-medium text-muted-foreground">Posição no mesmo nível</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => move(-1)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border/30 text-[10px] hover:border-accent/35"><ArrowLeft className="h-3.5 w-3.5" />Anterior</button><button type="button" onClick={() => move(1)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border/30 text-[10px] hover:border-accent/35">Próximo<ArrowRight className="h-3.5 w-3.5" /></button></div></div>
              <div className="rounded-lg border border-accent/15 bg-accent/5 p-3 text-[10px] leading-relaxed text-muted-foreground">Usuários deste cargo enxergam suas próprias tarefas e as tarefas de todos os cargos posicionados abaixo dele.</div>
            </div>
          ) : <div className="py-10 text-center"><UsersRound className="mx-auto h-6 w-6 text-muted-foreground/25" /><p className="mt-3 text-[11px] font-medium">Selecione um cargo</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground/45">As configurações do cargo aparecerão aqui.</p></div>}
        </aside>
      </div>
    </div>
  );
};
