import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, Save, UsersRound } from "lucide-react";

import type { Cargo } from "@/services";
import {
  buildCargoHierarchy,
  getCargoDescendantIds,
  moveCargoAmongSiblings,
  reparentCargo,
  serializeCargoHierarchy,
} from "./cargoHierarchyModel";
import { AdministratorDropTarget, CargoDragOverlay, HierarchyBranch } from "./CargoHierarchyDragNodes";

interface CargoHierarchyTreeProps {
  cargos: Cargo[];
  isSaving: boolean;
  onSave: (cargos: ReturnType<typeof serializeCargoHierarchy>) => Promise<void>;
}

const hierarchyCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

export const CargoHierarchyTree = ({ cargos, isSaving, onSave }: CargoHierarchyTreeProps) => {
  const [draft, setDraft] = useState<Cargo[]>(cargos);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeCargoId, setActiveCargoId] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const roots = useMemo(() => buildCargoHierarchy(draft), [draft]);
  const selected = draft.find((cargo) => cargo.id === selectedId) ?? null;
  const invalidParentIds = selected ? getCargoDescendantIds(draft, selected.id) : new Set<number>();
  const invalidDropIds = useMemo(() => {
    if (activeCargoId === null) return new Set<number>();
    return new Set([activeCargoId, ...getCargoDescendantIds(draft, activeCargoId)]);
  }, [activeCargoId, draft]);
  const activeCargo = draft.find((cargo) => cargo.id === activeCargoId) ?? null;

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

  const startDrag = (event: DragStartEvent) => {
    const cargoId = Number(event.active.data.current?.cargoId);
    if (!Number.isFinite(cargoId)) return;
    setActiveCargoId(cargoId);
    setSelectedId(cargoId);
  };

  const finishDrag = (event: DragEndEvent) => {
    const cargoId = Number(event.active.data.current?.cargoId);
    const target = event.over?.data.current;
    setActiveCargoId(null);
    if (!Number.isFinite(cargoId) || !target) return;

    const parentId = target.type === "administrator" ? null : Number(target.cargoId);
    if (parentId !== null && !Number.isFinite(parentId)) return;
    const next = reparentCargo(draft, cargoId, parentId);
    if (next === draft) return;
    setDraft(next);
    setDirty(true);
  };

  const reset = () => {
    setDraft(cargos);
    setSelectedId(null);
    setActiveCargoId(null);
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
          <p className="mt-1 text-[10px] text-muted-foreground/55">Arraste um cargo sobre outro para torná-lo subordinado ou solte-o sobre o Administrador para movê-lo à raiz.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={reset} disabled={!dirty || isSaving} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/30 px-3 text-[11px] text-muted-foreground disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />Desfazer</button>
          <button type="button" onClick={() => void save()} disabled={!dirty || isSaving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[11px] font-semibold text-accent-foreground disabled:opacity-40">{isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Salvar hierarquia</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <DndContext
          sensors={sensors}
          collisionDetection={hierarchyCollisionDetection}
          onDragStart={startDrag}
          onDragCancel={() => setActiveCargoId(null)}
          onDragEnd={finishDrag}
        >
          <section className="min-h-[520px] overflow-auto rounded-2xl border border-border/25 bg-[radial-gradient(circle_at_top,hsl(var(--accent)/0.08),transparent_45%)] p-8">
            <div className="flex min-w-max flex-col items-center">
              <AdministratorDropTarget />
              {roots.length > 0 ? (
                <>
                  <div className="h-8 border-l border-accent/45" />
                  <div className="flex border-t border-accent/45">
                    {roots.map((root) => (
                      <div key={root.id} className="relative px-3 pt-8 before:absolute before:left-1/2 before:top-0 before:h-8 before:border-l before:border-accent/45">
                        <HierarchyBranch node={root} selectedId={selectedId} invalidDropIds={invalidDropIds} onSelect={setSelectedId} />
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="mt-10 text-[11px] text-muted-foreground/50">Cadastre cargos para começar a estrutura.</p>}
            </div>
          </section>
          <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
            {activeCargo && <CargoDragOverlay cargoName={activeCargo.nome} />}
          </DragOverlay>
        </DndContext>

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
