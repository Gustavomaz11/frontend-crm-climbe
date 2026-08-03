import type { Cargo, CargoHierarquiaItem } from "@/services";

export interface CargoHierarchyNode extends Cargo {
  children: CargoHierarchyNode[];
}

const byHierarchyOrder = (left: Cargo, right: Cargo) =>
  (left.ordemHierarquia ?? 0) - (right.ordemHierarquia ?? 0)
  || left.nome.localeCompare(right.nome, "pt-BR");

export const buildCargoHierarchy = (cargos: Cargo[]): CargoHierarchyNode[] => {
  const nodes = new Map<number, CargoHierarchyNode>();
  cargos.forEach((cargo) => nodes.set(cargo.id, { ...cargo, children: [] }));

  const roots: CargoHierarchyNode[] = [];
  nodes.forEach((node) => {
    const parent = node.cargoSuperiorId ? nodes.get(node.cargoSuperiorId) : undefined;
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  });

  const sortNodes = (items: CargoHierarchyNode[]) => {
    items.sort(byHierarchyOrder);
    items.forEach((item) => sortNodes(item.children));
  };
  sortNodes(roots);
  return roots;
};

export const getCargoDescendantIds = (cargos: Cargo[], cargoId: number) => {
  const children = new Map<number, number[]>();
  cargos.forEach((cargo) => {
    if (!cargo.cargoSuperiorId) return;
    children.set(cargo.cargoSuperiorId, [...(children.get(cargo.cargoSuperiorId) ?? []), cargo.id]);
  });

  const descendants = new Set<number>();
  const pending = [...(children.get(cargoId) ?? [])];
  while (pending.length > 0) {
    const current = pending.shift();
    if (current === undefined || descendants.has(current)) continue;
    descendants.add(current);
    pending.push(...(children.get(current) ?? []));
  }
  return descendants;
};

const normalizeSiblingOrder = (cargos: Cargo[]) => {
  const siblings = new Map<number | null, Cargo[]>();
  cargos.forEach((cargo) => {
    const parentId = cargo.cargoSuperiorId ?? null;
    siblings.set(parentId, [...(siblings.get(parentId) ?? []), cargo]);
  });
  siblings.forEach((items) => {
    items.sort(byHierarchyOrder).forEach((cargo, index) => {
      cargo.ordemHierarquia = index;
    });
  });
  return cargos;
};

export const reparentCargo = (cargos: Cargo[], cargoId: number, cargoSuperiorId: number | null) => {
  if (cargoId === cargoSuperiorId || getCargoDescendantIds(cargos, cargoId).has(cargoSuperiorId ?? -1)) {
    return cargos;
  }
  const next = cargos.map((cargo) => ({ ...cargo }));
  const cargo = next.find((item) => item.id === cargoId);
  if (!cargo) return cargos;
  const newSiblings = next.filter((item) => (item.cargoSuperiorId ?? null) === cargoSuperiorId);
  cargo.cargoSuperiorId = cargoSuperiorId;
  cargo.ordemHierarquia = newSiblings.length;
  return normalizeSiblingOrder(next);
};

export const moveCargoAmongSiblings = (cargos: Cargo[], cargoId: number, direction: -1 | 1) => {
  const next = cargos.map((cargo) => ({ ...cargo }));
  const cargo = next.find((item) => item.id === cargoId);
  if (!cargo) return cargos;
  const parentId = cargo.cargoSuperiorId ?? null;
  const siblings = next.filter((item) => (item.cargoSuperiorId ?? null) === parentId).sort(byHierarchyOrder);
  const currentIndex = siblings.findIndex((item) => item.id === cargoId);
  const targetIndex = currentIndex + direction;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= siblings.length) return cargos;
  [siblings[currentIndex], siblings[targetIndex]] = [siblings[targetIndex], siblings[currentIndex]];
  siblings.forEach((item, index) => { item.ordemHierarquia = index; });
  return next;
};

export const serializeCargoHierarchy = (cargos: Cargo[]): CargoHierarquiaItem[] =>
  cargos.map((cargo) => ({
    cargoId: cargo.id,
    cargoSuperiorId: cargo.cargoSuperiorId ?? null,
    ordem: cargo.ordemHierarquia ?? 0,
  }));
