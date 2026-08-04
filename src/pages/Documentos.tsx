import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useSidebarState } from "@/hooks/useSidebarState";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, Calendar as CalendarIcon, Shield, Building2, Settings,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Search, FileCheck, X,
  Download, UserCheck, ScrollText, Plus, Send, Mail, AlertCircle, CheckCircle2,
  RotateCcw, Trash2, Check, XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getDocumentoDownloadUrl,
  useDeleteDocumento,
  useDocumentos,
  useEmpresas,
  useReenviarSolicitacaoDocumento,
  useSolicitarDocumentosLote,
  useValidarDocumento,
  REQUESTABLE_DOCUMENTS,
  type Documento,
  type DocumentoStatus,
} from "@/services";

const statusStyles: Record<string, string> = {
  PENDENTE: "bg-primary/10 text-primary",
  EM_ANALISE: "bg-yellow-500/10 text-yellow-600",
  APROVADO: "bg-accent/10 text-accent",
  REPROVADO: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em análise",
  APROVADO: "Aprovado",
  REPROVADO: "Rejeitado",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function podeReenviarSolicitacao(documento: Documento) {
  return !documento.caminho || documento.validado === "PENDENTE" || documento.validado === "REPROVADO";
}

const Documentos = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState("");
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);
  const [emailDestinatario, setEmailDestinatario] = useState("");
  const [requestMessage, setRequestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modalError, setModalError] = useState("");
  const navigate = useNavigate();

  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);
  const userName =
    basicUserData?.nomeCompleto ||
    userData?.nomeCompleto ||
    userData?.pessoa?.nomeCompleto ||
    "Usuario";
  const userPhoto =
    basicUserData?.fotoPerfil ||
    userData?.fotoPerfil ||
    userData?.pessoa?.fotoPerfil ||
    null;

  const { data: documentos = [], isLoading, error } = useDocumentos();
  const { data: empresas = [] } = useEmpresas();
  const solicitarDocumentos = useSolicitarDocumentosLote();
  const reenviarSolicitacaoDocumento = useReenviarSolicitacaoDocumento();
  const deleteDocumento = useDeleteDocumento();
  const validarDocumento = useValidarDocumento();

  const selectedEmpresa = useMemo(
    () => empresas.find((empresa) => String(empresa.id) === selectedEmpresaId),
    [empresas, selectedEmpresaId],
  );

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!documentos.length) return [];
    return documentos.filter((doc) =>
      doc.nome?.toLowerCase().includes(query) ||
      doc.tipo?.toLowerCase().includes(query) ||
      doc.nomeEmpresa?.toLowerCase().includes(query) ||
      doc.emailDestinatario?.toLowerCase().includes(query) ||
      statusLabels[doc.validado]?.toLowerCase().includes(query)
    );
  }, [searchQuery, documentos]);

  useEffect(() => {
    if (!requestMessage) return;
    const timer = window.setTimeout(() => setRequestMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [requestMessage]);

  function handleEmpresaChange(value: string) {
    setSelectedEmpresaId(value);
    const empresa = empresas.find((item) => String(item.id) === value);
    setEmailDestinatario(empresa?.email || "");
    setRequestMessage(null);
  }

  async function handleSolicitarDocumento() {
    const empresaId = Number(selectedEmpresaId);

    if (!empresaId) {
      setRequestMessage({ type: "error", text: "Selecione uma empresa para solicitar o documento." });
      return;
    }
    if (selectedDocumentTypes.length === 0) {
      setRequestMessage({ type: "error", text: "Selecione ao menos um documento." });
      return;
    }
    if (!emailDestinatario.trim()) {
      setRequestMessage({ type: "error", text: "Informe o e-mail que receberá o link de anexo." });
      return;
    }

    try {
      await solicitarDocumentos.mutateAsync({
        empresaId,
        documentos: selectedDocumentTypes,
        emailDestinatario: emailDestinatario.trim(),
      });
      setRequestMessage({ type: "success", text: "Solicitações criadas e um único link foi enviado por e-mail." });
      setSelectedDocumentTypes([]);
      setEmailDestinatario("");
      setSelectedEmpresaId("");
      setRequestOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao solicitar documento.";
      setRequestMessage({ type: "error", text: message });
    }
  }

  async function handleDownloadDocumento(documento: Documento) {
    setModalError("");

    try {
      const url = await getDocumentoDownloadUrl(documento.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao baixar documento.";
      setModalError(message);
    }
  }

  async function handleReenviarSolicitacao(documento: Documento) {
    setModalError("");

    try {
      const atualizado = await reenviarSolicitacaoDocumento.mutateAsync(documento.id);
      setSelectedDoc(atualizado);
      setRequestMessage({ type: "success", text: "Solicitação reenviada com novo link de anexo." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao reenviar solicitação.";
      setModalError(message);
    }
  }

  async function handleExcluirSolicitacao(documento: Documento) {
    setModalError("");

    const confirmed = window.confirm(`Excluir a solicitação "${documento.nome}"?`);
    if (!confirmed) return;

    try {
      await deleteDocumento.mutateAsync(documento.id);
      setSelectedDoc(null);
      setRequestMessage({ type: "success", text: "Solicitação excluída com sucesso." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir solicitação.";
      setModalError(message);
    }
  }

  async function handleValidarDocumento(
    documento: Documento,
    status: Extract<DocumentoStatus, "APROVADO" | "REPROVADO">,
  ) {
    setModalError("");
    setRequestMessage(null);

    if (documento.validado !== "EM_ANALISE") {
      setRequestMessage({ type: "error", text: "Somente documentos em análise podem ser aprovados ou reprovados." });
      return;
    }

    try {
      const atualizado = await validarDocumento.mutateAsync({ id: documento.id, status });
      const message =
        status === "APROVADO"
          ? "Documento aprovado com sucesso."
          : "Documento rejeitado. A solicitação voltou para pendência e um novo link foi enviado.";
      setSelectedDoc((current) => current?.id === documento.id ? atualizado : current);
      setRequestMessage({ type: "success", text: message });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar status do documento.";
      if (selectedDoc?.id === documento.id) {
        setModalError(message);
      } else {
        setRequestMessage({ type: "error", text: message });
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)` }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <motion.aside className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}`} initial={false} animate={{ x: 0, opacity: 1 }}>
          <div className={`flex items-center h-16 border-b border-border/20 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
            {sidebarCollapsed ? <motion.div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center"><span className="text-accent font-bold text-xs">C</span></motion.div> : <ClimbLogo className="h-[16px] text-foreground" />}
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto py-4 px-2">
            <AppSidebarNav collapsed={sidebarCollapsed} />
          </nav>
          <div className="border-t border-border/20 py-3 px-2 space-y-1">
            <motion.button onClick={() => setIsDark(!isDark)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}>
              <AnimatePresence mode="wait"><motion.div key={isDark ? "s" : "m"} initial={{ opacity: 0, rotate: -30 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 30 }}>{isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}</motion.div></AnimatePresence>
              {!sidebarCollapsed && <span className="text-[13px] font-medium">{isDark ? "Modo claro" : "Modo escuro"}</span>}
            </motion.button>
            <Link to="/"><motion.button className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}><LogOut className="w-[18px] h-[18px]" />{!sidebarCollapsed && <span className="text-[13px] font-medium">Sair</span>}</motion.button></Link>
          </div>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all shadow-sm">
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </motion.aside>

        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"}`}>
          <motion.header className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b border-border/20 bg-background/80 backdrop-blur-xl" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border/25 bg-card/30 backdrop-blur-sm text-muted-foreground w-[280px]">
              <Search className="w-3.5 h-3.5" />
              <input type="text" placeholder="Buscar documentos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground text-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <motion.button onClick={() => setRequestOpen(true)} className="h-9 px-3 rounded-lg bg-accent text-accent-foreground text-[12px] font-semibold flex items-center gap-2" whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Plus className="w-3.5 h-3.5" /> Solicitar
              </motion.button>
              <UserAvatar name={userName} photoUrl={userPhoto} />
            </div>
          </motion.header>

          <div className="px-6 pt-6 pb-2">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">Documentos</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">Acompanhe solicitações, anexos e análise de documentos por empresa.</p>
          </div>

          <div className="px-6 pb-6">
            <AnimatePresence>
              {requestMessage && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] ${requestMessage.type === "success" ? "border-accent/25 bg-accent/10 text-accent" : "border-destructive/25 bg-destructive/10 text-destructive"}`}>
                  {requestMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {requestMessage.text}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-[1.4fr_1fr_120px_120px_96px] px-5 py-3 border-b border-border/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Documento</span>
                <span>Empresa</span>
                <span>Status</span>
                <span>Data</span>
                <span>Ações</span>
              </div>
              <div className="divide-y divide-border/10 max-h-[calc(100vh-250px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                {isLoading ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground">Carregando documentos...</div>
                ) : error ? (
                  <div className="py-12 text-center text-[12px] text-destructive">Erro ao carregar documentos</div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground">Nenhum documento encontrado</div>
                ) : (
                  filtered.map((doc, i) => (
                    <motion.div key={doc.id} className="grid grid-cols-[1.4fr_1fr_120px_120px_96px] items-center px-5 py-4 hover:bg-muted/10 transition-colors cursor-pointer group" onClick={() => { setSelectedDoc(doc); setModalError(""); }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} whileHover={{ x: 2 }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <FileCheck className="w-4 h-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-foreground truncate">{doc.nome}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{doc.emailDestinatario || doc.tipo}</p>
                        </div>
                      </div>
                      <p className="text-[12px] text-foreground/65 truncate">{doc.nomeEmpresa || `Empresa #${doc.empresaId}`}</p>
                      <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full w-fit ${statusStyles[doc.validado] || "bg-muted/10 text-muted-foreground"}`}>{statusLabels[doc.validado] || doc.validado}</span>
                      <p className="text-[11px] text-muted-foreground">{formatDate(doc.dataUpload)}</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Aprovar documento"
                          onClick={(event) => { event.stopPropagation(); handleValidarDocumento(doc, "APROVADO"); }}
                          disabled={doc.validado !== "EM_ANALISE" || validarDocumento.isPending}
                          className="w-7 h-7 rounded-lg border border-border/25 flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Rejeitar documento"
                          onClick={(event) => { event.stopPropagation(); handleValidarDocumento(doc, "REPROVADO"); }}
                          disabled={doc.validado !== "EM_ANALISE" || validarDocumento.isPending}
                          className="w-7 h-7 rounded-lg border border-border/25 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {requestOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setRequestOpen(false)} />
            <motion.div className="relative z-10 w-full max-w-xl rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden" initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}>
              <div className="flex items-center justify-between p-5 border-b border-border/20">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">Solicitar documentos</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Marque os itens; o cliente receberá um único link para todos os anexos.</p>
                </div>
                <button onClick={() => setRequestOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block">Empresa</label>
                  <select value={selectedEmpresaId} onChange={(e) => handleEmpresaChange(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[12px] outline-none focus:border-accent/40 transition-colors text-foreground">
                    <option value="">Selecione a empresa</option>
                    {empresas.filter((empresa) => Number(empresa.id) > 0).map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Documentos</label>
                    <span className="text-[10px] text-accent">{selectedDocumentTypes.length} selecionado(s)</span>
                  </div>
                  <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {REQUESTABLE_DOCUMENTS.map((documento) => {
                      const checked = selectedDocumentTypes.includes(documento);
                      return (
                        <label key={documento} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-[11px] transition-colors ${checked ? "border-accent/40 bg-accent/10 text-accent" : "border-border/25 bg-background/40 text-foreground/70"}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setSelectedDocumentTypes((current) => checked ? current.filter((item) => item !== documento) : [...current, documento])}
                            className="accent-[hsl(var(--accent))]"
                          />
                          {documento}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block">E-mail para anexo</label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border/25 bg-background/50 focus-within:border-accent/40 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <input value={emailDestinatario} onChange={(e) => setEmailDestinatario(e.target.value)} placeholder={selectedEmpresa?.email || "email@empresa.com"} className="flex-1 bg-transparent text-[12px] outline-none text-foreground placeholder:text-muted-foreground" />
                  </div>
                </div>

                <button onClick={handleSolicitarDocumento} disabled={solicitarDocumentos.isPending} className="w-full h-10 rounded-lg bg-accent text-accent-foreground text-[12px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send className="w-4 h-4" />
                  {solicitarDocumentos.isPending ? "Enviando..." : "Enviar solicitação em lote"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDoc && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setSelectedDoc(null)} />
            <motion.div className="relative z-10 w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col" initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}>
              <div className="flex items-center justify-between p-5 border-b border-border/20">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">{selectedDoc.nome}</h2>
                  <p className="text-[11px] text-muted-foreground">{selectedDoc.tipo}</p>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="rounded-xl border border-border/20 bg-background/50 p-5 space-y-3">
                  <p className="text-[10px] text-muted-foreground font-medium tracking-[0.08em] uppercase">Detalhes</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-[10px] text-muted-foreground">Empresa</p><p className="text-[13px] text-foreground/80">{selectedDoc.nomeEmpresa || `Empresa #${selectedDoc.empresaId}`}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Status</p><p className="text-[13px] text-foreground/80">{statusLabels[selectedDoc.validado] || selectedDoc.validado}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Solicitado em</p><p className="text-[13px] text-foreground/80">{formatDate(selectedDoc.dataSolicitacao)}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Enviado em</p><p className="text-[13px] text-foreground/80">{formatDate(selectedDoc.dataEnvio)}</p></div>
                  </div>
                  <div><p className="text-[10px] text-muted-foreground">E-mail destinatário</p><p className="text-[13px] text-foreground/80">{selectedDoc.emailDestinatario || "-"}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleDownloadDocumento(selectedDoc)} disabled={!selectedDoc.caminho} className="h-10 rounded-lg border border-accent/20 bg-accent/10 text-accent text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-accent/20 transition-colors disabled:opacity-45 disabled:cursor-not-allowed">
                    <Download className="w-4 h-4" /> Baixar
                  </button>
                  <button onClick={() => handleReenviarSolicitacao(selectedDoc)} disabled={!podeReenviarSolicitacao(selectedDoc) || reenviarSolicitacaoDocumento.isPending} className="h-10 rounded-lg border border-primary/20 bg-primary/10 text-primary text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors disabled:opacity-45 disabled:cursor-not-allowed">
                    <RotateCcw className="w-4 h-4" /> {reenviarSolicitacaoDocumento.isPending ? "Reenviando..." : "Reenviar"}
                  </button>
                  <button onClick={() => handleExcluirSolicitacao(selectedDoc)} disabled={deleteDocumento.isPending} className="h-10 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors disabled:opacity-45 disabled:cursor-not-allowed">
                    <Trash2 className="w-4 h-4" /> {deleteDocumento.isPending ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleValidarDocumento(selectedDoc, "APROVADO")} disabled={selectedDoc.validado !== "EM_ANALISE" || validarDocumento.isPending} className="h-10 rounded-lg border border-accent/20 bg-accent/10 text-accent text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-accent/20 transition-colors disabled:opacity-45 disabled:cursor-not-allowed">
                    <Check className="w-4 h-4" /> {validarDocumento.isPending ? "Aprovando..." : "Aprovar"}
                  </button>
                  <button onClick={() => handleValidarDocumento(selectedDoc, "REPROVADO")} disabled={selectedDoc.validado !== "EM_ANALISE" || validarDocumento.isPending} className="h-10 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors disabled:opacity-45 disabled:cursor-not-allowed">
                    <XCircle className="w-4 h-4" /> {validarDocumento.isPending ? "Rejeitando..." : "Rejeitar"}
                  </button>
                </div>
                {modalError && <p className="text-[12px] text-destructive">{modalError}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Documentos;
