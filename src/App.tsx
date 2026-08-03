import { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/context/QueryProvider";
import { AuthProvider } from "@/context";
import { PrivateRoute } from "@/guards/PrivateRoute";
import { PublicRoute } from "@/guards/PublicRoute";
import { RouteLoading } from "@/components/layout/RouteLoading";
import {
  Agenda,
  AprovarAcesso,
  CadastroEmpresa,
  Cargos,
  CargosHierarquia,
  Contratos,
  ContratosKanban,
  Dashboard,
  Documentos,
  Empresas,
  EnviarDocumento,
  EnviarDocumentosLote,
  FirstAccess,
  Index,
  NotFound,
  PendingApproval,
  Perfil,
  Permissoes,
  PipelineCampanhas,
  PipelineDashboard,
  PipelineFunisAdmin,
  PipelineMotivosPerdaAdmin,
  PipelineScripts,
  PipelineVendas,
  Propostas,
  RecuperarSenha,
  RevisaoDocumentoPublica,
  SolicitarAcesso,
} from "@/routes/lazyPages";

const App = () => (
  <QueryProvider>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <SpeedInsights />
          <Analytics />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
            {/* Rotas Públicas */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Index />
                </PublicRoute>
              }
            />
            <Route
              path="/recuperar-senha"
              element={
                <PublicRoute>
                  <RecuperarSenha />
                </PublicRoute>
              }
            />
            <Route
              path="/solicitar-acesso"
              element={
                <PublicRoute>
                  <SolicitarAcesso />
                </PublicRoute>
              }
            />
            <Route
              path="/pending-approval"
              element={
                <PublicRoute>
                  <PendingApproval />
                </PublicRoute>
              }
            />
            <Route
              path="/documentos/enviar/lote/:token"
              element={
                <PublicRoute>
                  <EnviarDocumentosLote />
                </PublicRoute>
              }
            />
            <Route
              path="/documentos/enviar/:token"
              element={
                <PublicRoute>
                  <EnviarDocumento />
                </PublicRoute>
              }
            />

            {/* Rotas Privadas */}
            <Route
              path="/first-access"
              element={
                <PrivateRoute>
                  <FirstAccess />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/agenda"
              element={
                <PrivateRoute>
                  <Agenda />
                </PrivateRoute>
              }
            />
            <Route
              path="/permissoes"
              element={
                <PrivateRoute>
                  <Permissoes />
                </PrivateRoute>
              }
            />
            <Route
              path="/cargos"
              element={
                <PrivateRoute>
                  <Cargos />
                </PrivateRoute>
              }
            />
            <Route
              path="/cargos/hierarquia"
              element={
                <PrivateRoute>
                  <CargosHierarquia />
                </PrivateRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <PrivateRoute>
                  <Perfil />
                </PrivateRoute>
              }
            />
            <Route
              path="/empresas"
              element={
                <PrivateRoute>
                  <Empresas />
                </PrivateRoute>
              }
            />
            <Route
              path="/empresas/cadastro"
              element={
                <PrivateRoute>
                  <CadastroEmpresa />
                </PrivateRoute>
              }
            />
            <Route
              path="/empresas/:id/editar"
              element={
                <PrivateRoute>
                  <CadastroEmpresa />
                </PrivateRoute>
              }
            />
            <Route
              path="/documentos"
              element={
                <PrivateRoute>
                  <Documentos />
                </PrivateRoute>
              }
            />
            <Route
              path="/contratos"
              element={
                <PrivateRoute>
                  <Contratos />
                </PrivateRoute>
              }
            />
            <Route
              path="/contratos/kanban"
              element={
                <PrivateRoute>
                  <ContratosKanban />
                </PrivateRoute>
              }
            />
            <Route path="/revisao/:token" element={<RevisaoDocumentoPublica />} />
            <Route
              path="/pipeline-vendas"
              element={
                <PrivateRoute>
                  <PipelineVendas />
                </PrivateRoute>
              }
            />
            <Route
              path="/pipeline-vendas/funis"
              element={
                <PrivateRoute>
                  <PipelineFunisAdmin />
                </PrivateRoute>
              }
            />
            <Route
              path="/pipeline-vendas/dashboard"
              element={
                <PrivateRoute>
                  <PipelineDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/pipeline-vendas/motivos-perda"
              element={
                <PrivateRoute>
                  <PipelineMotivosPerdaAdmin />
                </PrivateRoute>
              }
            />
            <Route
              path="/pipeline-vendas/campanhas"
              element={
                <PrivateRoute>
                  <PipelineCampanhas />
                </PrivateRoute>
              }
            />
            <Route
              path="/pipeline-vendas/scripts"
              element={
                <PrivateRoute>
                  <PipelineScripts />
                </PrivateRoute>
              }
            />
            <Route
              path="/propostas"
              element={
                <PrivateRoute>
                  <Propostas />
                </PrivateRoute>
              }
            />

            <Route
              path="/aprovar-acesso"
              element={
                <PrivateRoute>
                  <AprovarAcesso />
                </PrivateRoute>
              }
            />

            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryProvider>
);

export default App;
