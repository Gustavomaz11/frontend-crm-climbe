import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type PageModule = { default: ComponentType };
type PageLoader = () => Promise<PageModule>;

const pageLoaders: Record<string, PageLoader> = {
  "/": () => import("@/pages/Index"),
  "/recuperar-senha": () => import("@/pages/RecuperarSenha"),
  "/solicitar-acesso": () => import("@/pages/SolicitarAcesso"),
  "/pending-approval": () => import("@/pages/PendingApproval"),
  "/documentos/enviar/lote/:token": () => import("@/pages/EnviarDocumentosLote"),
  "/documentos/enviar/:token": () => import("@/pages/EnviarDocumento"),
  "/first-access": () => import("@/pages/FirstAccess"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/agenda": () => import("@/pages/Agenda"),
  "/permissoes": () => import("@/pages/Permissoes"),
  "/cargos": () => import("@/pages/Cargos"),
  "/perfil": () => import("@/pages/Perfil"),
  "/empresas": () => import("@/pages/Empresas"),
  "/empresas/cadastro": () => import("@/pages/CadastroEmpresa"),
  "/empresas/:id/editar": () => import("@/pages/CadastroEmpresa"),
  "/documentos": () => import("@/pages/Documentos"),
  "/contratos": () => import("@/pages/Contratos"),
  "/contratos/kanban": () => import("@/pages/ContratosKanban"),
  "/revisao/:token": () => import("@/pages/RevisaoDocumentoPublica"),
  "/pipeline-vendas": () => import("@/pages/PipelineVendas"),
  "/pipeline-vendas/funis": () => import("@/pages/PipelineFunisAdmin"),
  "/pipeline-vendas/dashboard": () => import("@/pages/PipelineDashboard"),
  "/pipeline-vendas/motivos-perda": () => import("@/pages/PipelineMotivosPerdaAdmin"),
  "/pipeline-vendas/campanhas": () => import("@/pages/PipelineCampanhas"),
  "/pipeline-vendas/scripts": () => import("@/pages/PipelineScripts"),
  "/propostas": () => import("@/pages/Propostas"),
  "/aprovar-acesso": () => import("@/pages/AprovarAcesso"),
  "*": () => import("@/pages/NotFound"),
};

const lazyPage = (path: string): LazyExoticComponent<ComponentType> =>
  lazy(pageLoaders[path]);

export const preloadRoute = (path: string) => {
  const loader = pageLoaders[path];
  if (loader) void loader();
};

export const Index = lazyPage("/");
export const RecuperarSenha = lazyPage("/recuperar-senha");
export const SolicitarAcesso = lazyPage("/solicitar-acesso");
export const PendingApproval = lazyPage("/pending-approval");
export const EnviarDocumentosLote = lazyPage("/documentos/enviar/lote/:token");
export const EnviarDocumento = lazyPage("/documentos/enviar/:token");
export const FirstAccess = lazyPage("/first-access");
export const Dashboard = lazyPage("/dashboard");
export const Agenda = lazyPage("/agenda");
export const Permissoes = lazyPage("/permissoes");
export const Cargos = lazyPage("/cargos");
export const Perfil = lazyPage("/perfil");
export const Empresas = lazyPage("/empresas");
export const CadastroEmpresa = lazyPage("/empresas/cadastro");
export const Documentos = lazyPage("/documentos");
export const Contratos = lazyPage("/contratos");
export const ContratosKanban = lazyPage("/contratos/kanban");
export const RevisaoDocumentoPublica = lazyPage("/revisao/:token");
export const PipelineVendas = lazyPage("/pipeline-vendas");
export const PipelineFunisAdmin = lazyPage("/pipeline-vendas/funis");
export const PipelineDashboard = lazyPage("/pipeline-vendas/dashboard");
export const PipelineMotivosPerdaAdmin = lazyPage("/pipeline-vendas/motivos-perda");
export const PipelineCampanhas = lazyPage("/pipeline-vendas/campanhas");
export const PipelineScripts = lazyPage("/pipeline-vendas/scripts");
export const Propostas = lazyPage("/propostas");
export const AprovarAcesso = lazyPage("/aprovar-acesso");
export const NotFound = lazyPage("*");
