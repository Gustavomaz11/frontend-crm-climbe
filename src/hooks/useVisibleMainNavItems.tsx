import { useMemo } from "react";
import { CONTRATO_ACCESS_CODES } from "./useContratoPermissions";
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
  Network,
  UsersRound,
  KeyRound,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUsuarioPermissoes } from "@/services";
import { useAcessoKanban } from "@/services/useContratos";

export interface MainNavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  permissions?: string[];
  adminOnly?: boolean;
}

const mainNavItems: MainNavItem[] = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: FileText, label: "Contratos", path: "/contratos", permissions: CONTRATO_ACCESS_CODES },
  { icon: LayoutDashboard, label: "Kanban", path: "/contratos/kanban", permissions: ["CONTRATO_KANBAN"] },
  { icon: TrendingUp, label: "Pré-vendas", path: "/pipeline-pre-vendas", permissions: ["COMERCIAL"] },
  { icon: TrendingUp, label: "Pipeline de Vendas", path: "/pipeline-vendas", permissions: ["COMERCIAL"] },
  { icon: BarChart3, label: "Dashboard Comercial", path: "/pipeline-vendas/dashboard", permissions: ["COMERCIAL_DASHBOARD_VISUALIZAR"] },
  { icon: ListX, label: "Motivos de Perda", path: "/pipeline-vendas/motivos-perda", permissions: ["COMERCIAL_MOTIVO_PERDA_VISUALIZAR"] },
  { icon: Megaphone, label: "Campanhas", path: "/pipeline-vendas/campanhas", permissions: ["COMERCIAL_CAMPANHA_VISUALIZAR"] },
  { icon: SlidersHorizontal, label: "Tags e campos", path: "/pipeline-vendas/cadastros", permissions: ["COMERCIAL"] },
  { icon: FileCode2, label: "Biblioteca de Scripts", path: "/pipeline-vendas/scripts", permissions: ["COMERCIAL_SCRIPT_VISUALIZAR"] },
  { icon: SlidersHorizontal, label: "Configuração de Funis", path: "/pipeline-vendas/funis", permissions: ["COMERCIAL_FUNIL_VISUALIZAR"] },
  { icon: ScrollText, label: "Propostas", path: "/propostas", adminOnly: true, permissions: ["PROPOSTA_LER", "PROPOSTA_CRIAR", "PROPOSTA_EDITAR", "PROPOSTA_DELETAR"] },
  { icon: CalendarIcon, label: "Agenda", path: "/agenda", permissions: ["REUNIAO_AGENDAMENTO"] },
  { icon: Shield, label: "Permissões", path: "/permissoes", permissions: ["PERMITIR_ACESSO"] },
  { icon: Mail, label: "Convite", path: "/configuracoes/convite", permissions: ["PERMITIR_ACESSO"] },
  { icon: KeyRound, label: "Tokens e Integração", path: "/integracoes", permissions: ["INTEGRACOES_GERENCIAR"] },
  { icon: BriefcaseBusiness, label: "Cargos", path: "/cargos", permissions: ["CARGO_LER", "CARGO_CRIAR", "CARGO_EDITAR", "CARGO_DELETAR"] },
  { icon: Network, label: "Hierarquia de cargos", path: "/cargos/hierarquia", permissions: ["CARGO_HIERARQUIA_EDITAR"] },
  { icon: Building2, label: "Empresas", path: "/empresas" },
  { icon: UsersRound, label: "Pessoas", path: "/pessoas" },
  {
    icon: FileCheck,
    label: "Documentos",
    path: "/documentos",
    adminOnly: true,
    permissions: ["DOCUMENTO_JURIDICO_LER", "DOCUMENTO_JURIDICO_CRIAR", "DOCUMENTO_JURIDICO_EDITAR", "DOCUMENTO_JURIDICO_DELETAR"],
  },
  { icon: UserCheck, label: "Solicitações", path: "/aprovar-acesso", permissions: ["PERMITIR_ACESSO"] },
];

export function useVisibleMainNavItems() {
  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);
  const usuarioId = basicUserData?.id ?? userData?.id;

  const { data: usuarioPermissoes = [], isLoading } = useUsuarioPermissoes(usuarioId);
  const temPermissaoKanban = usuarioPermissoes.some(associacao => associacao.permissao?.codigo === "CONTRATO_KANBAN");
  const { data: temContratosKanban = false } = useAcessoKanban(usuarioId, !isLoading && !temPermissaoKanban);

  return useMemo(() => {
    const permissionCodes = new Set(
      usuarioPermissoes
        .map((associacao) => associacao.permissao?.codigo)
        .filter(Boolean),
    );

    return mainNavItems.filter((item) => {
      if (item.adminOnly && !permissionCodes.has("PERMITIR_ACESSO")) return false;
      if (item.path === "/contratos/kanban" && temContratosKanban) return true;
      if (!item.permissions?.length) return true;
      return item.permissions.some((permission) => permissionCodes.has(permission));
    });
  }, [usuarioPermissoes, temContratosKanban]);
}
