import { useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Crown, GripVertical, UsersRound } from "lucide-react";

import type { CargoHierarchyNode } from "./cargoHierarchyModel";

interface HierarchyBranchProps {
  node: CargoHierarchyNode;
  selectedId: number | null;
  invalidDropIds: Set<number>;
  onSelect: (id: number) => void;
}

export const HierarchyBranch = ({ node, selectedId, invalidDropIds, onSelect }: HierarchyBranchProps) => {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef: setDraggableNodeRef,
  } = useDraggable({
    id: `cargo:${node.id}`,
    data: { type: "cargo", cargoId: node.id },
  });
  const {
    isOver,
    setNodeRef: setDroppableNodeRef,
  } = useDroppable({
    id: `cargo-target:${node.id}`,
    data: { type: "cargo", cargoId: node.id },
    disabled: invalidDropIds.has(node.id),
  });
  const setNodeRef = useCallback((element: HTMLDivElement | null) => {
    setDraggableNodeRef(element);
    setDroppableNodeRef(element);
  }, [setDraggableNodeRef, setDroppableNodeRef]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={setNodeRef}
        className={`relative z-10 w-52 rounded-xl transition ${isDragging ? "opacity-25" : "opacity-100"}`}
      >
        <motion.button
          layout
          type="button"
          onClick={() => onSelect(node.id)}
          className={`min-h-20 w-full rounded-xl border px-4 py-3 pr-10 text-left shadow-sm transition-colors ${isOver ? "border-accent bg-accent/20 ring-4 ring-accent/15" : selectedId === node.id ? "border-accent/60 bg-accent/12 ring-2 ring-accent/10" : "border-border/30 bg-card/90 hover:border-accent/35 hover:bg-card"}`}
        >
          <span className="mb-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/45">
            <UsersRound className="h-3.5 w-3.5" />Cargo
          </span>
          <span className="block text-[12px] font-semibold leading-snug text-foreground">{node.nome}</span>
          <span className="mt-1 block text-[9px] text-muted-foreground/45">{node.children.length} subordinado(s) direto(s)</span>
        </motion.button>
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Arrastar ${node.nome}`}
          title="Arraste para alterar a hierarquia"
          className="absolute right-2 top-2 inline-flex h-8 w-7 touch-none cursor-grab items-center justify-center rounded-lg text-muted-foreground/45 transition hover:bg-accent/10 hover:text-accent active:cursor-grabbing"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      {node.children.length > 0 && (
        <>
          <div className="h-6 border-l border-accent/35" />
          <div className="flex border-t border-accent/35">
            {node.children.map((child) => (
              <div key={child.id} className="relative px-3 pt-6 before:absolute before:left-1/2 before:top-0 before:h-6 before:border-l before:border-accent/35">
                <HierarchyBranch node={child} selectedId={selectedId} invalidDropIds={invalidDropIds} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const AdministratorDropTarget = () => {
  const { isOver, setNodeRef } = useDroppable({
    id: "administrator-root",
    data: { type: "administrator", cargoId: null },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-24 w-60 flex-col justify-center rounded-2xl border px-5 py-4 text-center shadow-lg transition ${isOver ? "scale-[1.03] border-accent bg-accent/25 shadow-accent/15 ring-4 ring-accent/15" : "border-accent/40 bg-accent/10 shadow-accent/5"}`}
    >
      <Crown className="mx-auto mb-2 h-5 w-5 text-accent" />
      <p className="text-[14px] font-bold">Administrador</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">Raiz fixa da organização</p>
      {isOver && <p className="mt-2 text-[9px] font-semibold text-accent">Solte para mover à raiz</p>}
    </div>
  );
};

export const CargoDragOverlay = ({ cargoName }: { cargoName: string }) => (
  <div className="w-52 rotate-1 rounded-xl border border-accent bg-card px-4 py-3 shadow-2xl shadow-black/30 ring-4 ring-accent/10">
    <span className="mb-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-accent">
      <GripVertical className="h-3.5 w-3.5" />Movendo cargo
    </span>
    <span className="block text-[12px] font-semibold leading-snug text-foreground">{cargoName}</span>
  </div>
);
