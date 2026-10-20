import { useAvisosTempoReal } from "@/hooks/useAvisosTempoReal";
import { useAuthStore } from "@/store/useAuthStore";
import { NotificacoesPopup } from "./NotificacoesPopup";

export const AvisosTempoReal = () => {
  const usuarioId = useAuthStore(state => state.basicUserData?.id ?? state.userData?.id);
  useAvisosTempoReal(usuarioId);
  return <NotificacoesPopup />;
};
