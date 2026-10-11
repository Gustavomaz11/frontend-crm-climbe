import { useUsuarioPermissoes } from "@/services/usePermissoes";
import { useAuthStore } from "@/store/useAuthStore";

export const JURIDICO_CONTRATO_CODES = [
  "JURIDICO_CONTRATO_LER",
  "JURIDICO_CONTRATO_CRIAR",
  "JURIDICO_CONTRATO_EDITAR",
  "JURIDICO_CONTRATO_DELETAR",
  "JURIDICO_CONTRATO_MOVIMENTAR",
  "JURIDICO_CONTRATO_ANEXAR_ARQUIVO",
  "JURIDICO_CONTRATO_ENVIAR_CLIENTE",
  "JURIDICO_CONTRATO_ENVIAR_NOVA_VERSAO",
  "JURIDICO_CONTRATO_REENVIAR",
  "JURIDICO_CONTRATO_RESPONSAVEIS_EDITAR",
  "JURIDICO_CONTRATO_VENCIMENTOS_EDITAR",
  "JURIDICO_CONTRATO_APROVAR",
  "JURIDICO_CONTRATO_DESVINCULAR_PROPOSTA",
  "JURIDICO_CONTRATO_ARQUIVAR",
  "JURIDICO_CONTRATO_DESARQUIVAR",
] as const;
export const CONTRATO_ACCESS_CODES = ["CONTRATO_LER", "CONTRATO_CRIAR", "CONTRATO_EDITAR", "CONTRATO_DELETAR", ...JURIDICO_CONTRATO_CODES];

export const getContratoPermissions = (codes: ReadonlySet<string>) => {
  const allowed = (action: string, legacy = "EDITAR") => codes.has(`JURIDICO_CONTRATO_${action}`) || codes.has(`CONTRATO_${legacy}`);
  const permissions = {
    canRead: allowed("LER", "LER"),
    canCreate: allowed("CRIAR", "CRIAR"),
    canEdit: allowed("EDITAR"),
    canDelete: allowed("DELETAR", "DELETAR"),
    canMove: allowed("MOVIMENTAR"),
    canAttachFile: allowed("ANEXAR_ARQUIVO"),
    canSendClient: allowed("ENVIAR_CLIENTE"),
    canSendNewVersion: allowed("ENVIAR_NOVA_VERSAO"),
    canResend: allowed("REENVIAR"),
    canEditResponsibles: allowed("RESPONSAVEIS_EDITAR"),
    canEditDueDates: allowed("VENCIMENTOS_EDITAR"),
    canApprove: allowed("APROVAR"),
    canUnlinkProposal: allowed("DESVINCULAR_PROPOSTA"),
    canArchive: allowed("ARQUIVAR"),
    canRestore: allowed("DESARQUIVAR"),
  };
  return {
    ...permissions,
    canAccess: CONTRATO_ACCESS_CODES.some(code => codes.has(code)),
    canCreateWithUpload: permissions.canCreate && (codes.has("CONTRATO_CRIAR") || permissions.canSendClient),
  };
};

export const useContratoPermissions = () => {
  const usuarioId = useAuthStore(state => state.basicUserData?.id ?? state.userData?.id);
  const { data = [], isLoading } = useUsuarioPermissoes(usuarioId);
  return { ...getContratoPermissions(new Set(data.map(item => item.permissao.codigo))), isLoading };
};
