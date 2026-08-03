import { describe, expect, it } from "vitest";

import type { Cargo } from "@/services";
import { buildCargoHierarchy, getCargoDescendantIds, reparentCargo } from "./cargoHierarchyModel";

const cargos: Cargo[] = [
  { id: 1, nome: "Diretor de TI", cargoSuperiorId: null, ordemHierarquia: 0 },
  { id: 2, nome: "Coordenador de TI", cargoSuperiorId: 1, ordemHierarquia: 0 },
  { id: 3, nome: "Analista de TI", cargoSuperiorId: 2, ordemHierarquia: 0 },
  { id: 4, nome: "Diretor Comercial", cargoSuperiorId: null, ordemHierarquia: 1 },
];

describe("cargoHierarchyModel", () => {
  it("monta segmentos irmãos e seus subordinados", () => {
    const tree = buildCargoHierarchy(cargos);

    expect(tree.map((item) => item.id)).toEqual([1, 4]);
    expect(tree[0].children[0].id).toBe(2);
    expect(tree[0].children[0].children[0].id).toBe(3);
  });

  it("encontra todos os descendentes sem incluir cargos irmãos", () => {
    expect(getCargoDescendantIds(cargos, 1)).toEqual(new Set([2, 3]));
  });

  it("impede mover um cargo para baixo de seu próprio descendente", () => {
    expect(reparentCargo(cargos, 1, 3)).toBe(cargos);
  });

  it("move um cargo para outro segmento e preserva os demais ramos", () => {
    const moved = reparentCargo(cargos, 3, 4);
    const tree = buildCargoHierarchy(moved);

    expect(moved.find((cargo) => cargo.id === 3)?.cargoSuperiorId).toBe(4);
    expect(tree.find((cargo) => cargo.id === 1)?.children.map((cargo) => cargo.id)).toEqual([2]);
    expect(tree.find((cargo) => cargo.id === 4)?.children.map((cargo) => cargo.id)).toEqual([3]);
  });
});
