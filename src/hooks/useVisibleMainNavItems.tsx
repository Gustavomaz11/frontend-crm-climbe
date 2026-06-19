import { useMemo } from "react";
import {
  Home,
  FileText,
  Calendar as CalendarIcon,
  Shield,
  Building2,
  FileCheck,
  UserCheck,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUsuarioPermissoes } from "@/services";

export interface MainNavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  permissions?: string[];
}

const mainNavItems: MainNavItem[] = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: FileText, label: "Contratos", path: "/contratos", permissions: ["CONTRATO_CRUD"] },
  { icon: ScrollText, label: "Propostas", path: "/propostas", permissions: ["PROPOSTA_CRUD"] },
  { icon: CalendarIcon, label: "Agenda", path: "/agenda", permissions: ["REUNIAO_AGENDAMENTO"] },
  { icon: Shield, label: "Permissões", path: "/permissoes", permissions: ["PERMITIR_ACESSO", "CARGO_CRUD"] },
  { icon: Building2, label: "Empresas", path: "/empresas" },
  {
    icon: FileCheck,
    label: "Documentos",
    path: "/documentos",
    permissions: ["DOCUMENTO_JURIDICO_CRUD", "ARQUIVO_UPLOAD", "ARQUIVO_DOWNLOAD"],
  },
  { icon: UserCheck, label: "Solicitações", path: "/aprovar-acesso", permissions: ["PERMITIR_ACESSO"] },
];

export function useVisibleMainNavItems() {
  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);
  const usuarioId = basicUserData?.id ?? userData?.id;

  const { data: usuarioPermissoes = [] } = useUsuarioPermissoes(usuarioId);

  return useMemo(() => {
    const permissionCodes = new Set(
      usuarioPermissoes
        .map((associacao) => associacao.permissao?.codigo)
        .filter(Boolean),
    );

    return mainNavItems.filter((item) => {
      if (!item.permissions?.length) return true;
      return item.permissions.some((permission) => permissionCodes.has(permission));
    });
  }, [usuarioPermissoes]);
}
