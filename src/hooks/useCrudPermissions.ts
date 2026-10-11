import { useUsuarioPermissoes } from "@/services/usePermissoes";
import { useAuthStore } from "@/store/useAuthStore";

export type CrudResource = "CONTRATO" | "PROPOSTA" | "CARGO" | "DOCUMENTO_JURIDICO" | "RELATORIO";

export function useCrudPermissions(resource: CrudResource) {
  const usuarioId = useAuthStore(state => state.basicUserData?.id ?? state.userData?.id);
  const { data = [], isLoading } = useUsuarioPermissoes(usuarioId);
  const codes = new Set(data.map(item => item.permissao.codigo));
  const canRead = codes.has(`${resource}_LER`);
  const canCreate = codes.has(`${resource}_CRIAR`);
  const canEdit = codes.has(`${resource}_EDITAR`);
  const canDelete = codes.has(`${resource}_DELETAR`);
  return { canRead, canCreate, canEdit, canDelete, canAccess: canRead || canCreate || canEdit || canDelete, isLoading };
}
