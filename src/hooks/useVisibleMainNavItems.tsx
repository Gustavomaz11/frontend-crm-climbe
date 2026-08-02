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
  LayoutDashboard,
  TrendingUp,
  SlidersHorizontal,
  BarChart3,
  ListX,
  Megaphone,
  FileCode2,
  BriefcaseBusiness,
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
  { icon: LayoutDashboard, label: "Kanban", path: "/contratos/kanban", permissions: ["CONTRATO_KANBAN"] },
  { icon: TrendingUp, label: "Pipeline de Vendas", path: "/pipeline-vendas", permissions: ["COMERCIAL"] },
  { icon: BarChart3, label: "Dashboard Comercial", path: "/pipeline-vendas/dashboard", permissions: ["COMERCIAL_DASHBOARD_VISUALIZAR"] },
  { icon: ListX, label: "Motivos de Perda", path: "/pipeline-vendas/motivos-perda", permissions: ["COMERCIAL_MOTIVO_PERDA_VISUALIZAR"] },
  { icon: Megaphone, label: "Campanhas", path: "/pipeline-vendas/campanhas", permissions: ["COMERCIAL_CAMPANHA_VISUALIZAR"] },
  { icon: FileCode2, label: "Biblioteca de Scripts", path: "/pipeline-vendas/scripts", permissions: ["COMERCIAL_SCRIPT_VISUALIZAR"] },
  { icon: SlidersHorizontal, label: "Configuração de Funis", path: "/pipeline-vendas/funis", permissions: ["COMERCIAL_FUNIL_VISUALIZAR"] },
  { icon: ScrollText, label: "Propostas", path: "/propostas", permissions: ["PROPOSTA_CRUD"] },
  { icon: CalendarIcon, label: "Agenda", path: "/agenda", permissions: ["REUNIAO_AGENDAMENTO"] },
  { icon: Shield, label: "Permissões", path: "/permissoes", permissions: ["PERMITIR_ACESSO", "CARGO_CRUD"] },
  { icon: BriefcaseBusiness, label: "Cargos", path: "/cargos", permissions: ["CARGO_CRUD"] },
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
