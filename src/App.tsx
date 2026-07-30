import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/context/QueryProvider";
import { AuthProvider } from "@/context";
import { PrivateRoute } from "@/guards/PrivateRoute";
import { PublicRoute } from "@/guards/PublicRoute";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import RecuperarSenha from "./pages/RecuperarSenha.tsx";
import SolicitarAcesso from "./pages/SolicitarAcesso.tsx";
import PendingApproval from "./pages/PendingApproval.tsx";
import FirstAccess from "./pages/FirstAccess.tsx";
import Agenda from "./pages/Agenda.tsx";
import Permissoes from "./pages/Permissoes.tsx";
import Empresas from "./pages/Empresas.tsx";
import Documentos from "./pages/Documentos.tsx";
import EnviarDocumento from "./pages/EnviarDocumento.tsx";
import Contratos from "./pages/Contratos.tsx";
import ContratosKanban from "./pages/ContratosKanban.tsx";
import Propostas from "./pages/Propostas.tsx";
import NotFound from "./pages/NotFound.tsx";
import AprovarAcesso from "./pages/AprovarAcesso.tsx";
import CadastroEmpresa from "./pages/CadastroEmpresa.tsx";
import PipelineVendas from "./pages/PipelineVendas.tsx";
import PipelineFunisAdmin from "./pages/PipelineFunisAdmin.tsx";
import PipelineDashboard from "./pages/PipelineDashboard.tsx";
import PipelineMotivosPerdaAdmin from "./pages/PipelineMotivosPerdaAdmin.tsx";
import PipelineCampanhas from "./pages/PipelineCampanhas.tsx";
import PipelineScripts from "./pages/PipelineScripts.tsx";
import RevisaoDocumentoPublica from "./pages/RevisaoDocumentoPublica.tsx";

const App = () => (
  <QueryProvider>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <SpeedInsights />
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
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryProvider>
);

export default App;
