import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCrudPermissions, type CrudResource } from "./useCrudPermissions";

let codes: string[] = [];
vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: (select: (state: unknown) => unknown) => select({ basicUserData: { id: 7 } }),
}));
vi.mock("@/services/usePermissoes", () => ({
  useUsuarioPermissoes: () => ({ data: codes.map(codigo => ({ permissao: { codigo } })), isLoading: false }),
}));

const resources: CrudResource[] = ["CONTRATO", "PROPOSTA", "CARGO", "DOCUMENTO_JURIDICO", "RELATORIO"];
describe("ações independentes", () => {
  for (const resource of resources) {
    it.each(["LER", "CRIAR", "EDITAR", "DELETAR"])(`${resource}: conceder %s mantém as demais negadas`, action => {
      codes = [`${resource}_${action}`];
      const { result } = renderHook(() => useCrudPermissions(resource));
      expect(result.current).toMatchObject({
        canRead: action === "LER", canCreate: action === "CRIAR",
        canEdit: action === "EDITAR", canDelete: action === "DELETAR", canAccess: true,
      });
    });
  }

  it("não autoriza códigos completos removidos nem ações de outro recurso", () => {
    codes = ["CONTRATO_CRUD", "PROPOSTA_EDITAR"];
    const { result } = renderHook(() => useCrudPermissions("CONTRATO"));
    expect(result.current.canAccess).toBe(false);
  });
});
