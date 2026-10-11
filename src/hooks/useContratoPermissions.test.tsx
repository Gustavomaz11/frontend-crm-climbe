import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getContratoPermissions, JURIDICO_CONTRATO_CODES, useContratoPermissions } from "./useContratoPermissions";
import { useVisibleMainNavItems } from "./useVisibleMainNavItems";
let codes: string[] = [];
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ basicUserData: { id: 7 } }) }));
vi.mock("@/services/usePermissoes", () => ({ useUsuarioPermissoes: () => ({ data: codes.map(codigo => ({ permissao: { codigo } })), isLoading: false }) }));
vi.mock("@/services", () => ({ useUsuarioPermissoes: () => ({ data: codes.map(codigo => ({ permissao: { codigo } })) }) }));
vi.mock("@/services/useContratos", () => ({ useAcessoKanban: () => ({ data: false }) }));
const fields = {
  "LER": "canRead",
  "CRIAR": "canCreate",
  "EDITAR": "canEdit",
  "DELETAR": "canDelete",
  "MOVIMENTAR": "canMove",
  "ANEXAR_ARQUIVO": "canAttachFile",
  "ENVIAR_CLIENTE": "canSendClient",
  "ENVIAR_NOVA_VERSAO": "canSendNewVersion",
  "REENVIAR": "canResend",
  "RESPONSAVEIS_EDITAR": "canEditResponsibles",
  "VENCIMENTOS_EDITAR": "canEditDueDates",
  "APROVAR": "canApprove",
  "DESVINCULAR_PROPOSTA": "canUnlinkProposal",
  "ARQUIVAR": "canArchive",
  "DESARQUIVAR": "canRestore"
} as const;
describe("permissões granulares do Jurídico", () => {
  it.each(JURIDICO_CONTRATO_CODES)("conceder %s autoriza somente a ação correspondente", code => {
    const permissions = getContratoPermissions(new Set([code]));
    for (const [action, field] of Object.entries(fields)) {
      expect(permissions[field]).toBe(code === `JURIDICO_CONTRATO_${action}`);
    }
    expect(permissions.canAccess).toBe(true);
  });
  it("criar com upload requer envio porque esse fluxo envia o documento ao cliente", () => {
    expect(getContratoPermissions(new Set(["JURIDICO_CONTRATO_CRIAR"])).canCreateWithUpload).toBe(false);
    expect(getContratoPermissions(new Set(["JURIDICO_CONTRATO_CRIAR", "JURIDICO_CONTRATO_ENVIAR_CLIENTE"])).canCreateWithUpload).toBe(true);
    expect(getContratoPermissions(new Set(["CONTRATO_CRIAR"])).canCreateWithUpload).toBe(true);
  });
  it("preserva os acessos anteriores sem liberar criação ou exclusão para um editor", () => {
    const permissions = getContratoPermissions(new Set(["CONTRATO_EDITAR"]));
    expect(permissions.canSendClient).toBe(true); expect(permissions.canRestore).toBe(true);
    expect(permissions.canCreate).toBe(false); expect(permissions.canDelete).toBe(false);
  });
  it("mostra a aba Contratos ao Jurídico sem liberar Propostas ou o kanban de execução", () => {
    codes = ["JURIDICO_CONTRATO_LER"];
    const { result } = renderHook(() => useVisibleMainNavItems());
    const paths = result.current.map(item => item.path);
    expect(paths).toContain("/contratos");
    expect(paths).not.toContain("/propostas"); expect(paths).not.toContain("/contratos/kanban");
    const { result: access } = renderHook(() => useContratoPermissions());
    expect(access.current.canRead).toBe(true); expect(access.current.canSendClient).toBe(false);
  });
});
