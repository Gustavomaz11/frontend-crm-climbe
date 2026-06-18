import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, Calendar as CalendarIcon, Shield, Building2, Settings,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Search, FileCheck, X,
  Download, UserCheck, ScrollText, Plus, Send, Mail, AlertCircle, CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getDocumentoDownloadUrl,
  useDocumentos,
  useEmpresas,
  useSolicitarDocumento,
  type Documento,
} from "@/services";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: FileText, label: "Contratos", path: "/contratos" },
  { icon: ScrollText, label: "Propostas", path: "/propostas" },
  { icon: CalendarIcon, label: "Agenda", path: "/agenda" },
  { icon: Shield, label: "Permissões", path: "/permissoes" },
  { icon: Building2, label: "Empresas", path: "/empresas" },
  { icon: FileCheck, label: "Documentos", path: "/documentos" },
  { icon: UserCheck, label: "Solicitações", path: "/aprovar-acesso" },
  { icon: Settings, label: "Configurações", path: "/dashboard" },
];

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
  REPROVADO: "Reprovado",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

const Documentos = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
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
  const solicitarDocumento = useSolicitarDocumento();

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
    if (!titulo.trim()) {
      setRequestMessage({ type: "error", text: "Informe o título do documento solicitado." });
      return;
    }
    if (!emailDestinatario.trim()) {
      setRequestMessage({ type: "error", text: "Informe o e-mail que receberá o link de anexo." });
      return;
    }

    try {
      await solicitarDocumento.mutateAsync({
        empresaId,
        titulo: titulo.trim(),
        tipoDocumento: tipoDocumento.trim() || titulo.trim(),
        emailDestinatario: emailDestinatario.trim(),
      });
      setRequestMessage({ type: "success", text: "Solicitação criada e e-mail enviado para anexo." });
      setTitulo("");
      setTipoDocumento("");
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

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)` }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <motion.aside className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className={`flex items-center h-16 border-b border-border/20 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
            {sidebarCollapsed ? <motion.div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center"><span className="text-accent font-bold text-xs">C</span></motion.div> : <ClimbLogo className="h-[16px] text-foreground" />}
          </div>
          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map((item) => (
              <motion.button key={item.label} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-3 rounded-lg transition-all group relative ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"} ${item.label === "Documentos" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`} whileHover={{ x: sidebarCollapsed ? 0 : 2 }} whileTap={{ scale: 0.98 }}>
                {item.label === "Documentos" && <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" layoutId="activeNav" />}
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!sidebarCollapsed && <span className="text-[13px] font-medium">{item.label}</span>}
              </motion.button>
            ))}
          </nav>
          <div className="border-t border-border/20 py-3 px-2 space-y-1">
            <motion.button onClick={() => setIsDark(!isDark)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}>
              <AnimatePresence mode="wait"><motion.div key={isDark ? "s" : "m"} initial={{ opacity: 0, rotate: -30 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 30 }}>{isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}</motion.div></AnimatePresence>
              {!sidebarCollapsed && <span className="text-[13px] font-medium">{isDark ? "Modo claro" : "Modo escuro"}</span>}
            </motion.button>
            <Link to="/"><motion.button className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-all ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}><LogOut className="w-[18px] h-[18px]" />{!sidebarCollapsed && <span className="text-[13px] font-medium">Sair</span>}</motion.button></Link>
          </div>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all shadow-sm">
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </motion.aside>

        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"}`}>
          <motion.header className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b border-border/20 bg-background/80 backdrop-blur-xl" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border/25 bg-card/30 backdrop-blur-sm text-muted-foreground/50 w-[280px]">
              <Search className="w-3.5 h-3.5" />
              <input type="text" placeholder="Buscar documentos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/30 text-foreground" />
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
            <p className="text-[12px] text-muted-foreground/50 mt-0.5">Acompanhe solicitações, anexos e análise de documentos por empresa.</p>
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
              <div className="grid grid-cols-[1.4fr_1fr_120px_120px] px-5 py-3 border-b border-border/15 text-[10px] uppercase tracking-wider text-muted-foreground/40">
                <span>Documento</span>
                <span>Empresa</span>
                <span>Status</span>
                <span>Data</span>
              </div>
              <div className="divide-y divide-border/10 max-h-[calc(100vh-250px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                {isLoading ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground/50">Carregando documentos...</div>
                ) : error ? (
                  <div className="py-12 text-center text-[12px] text-destructive">Erro ao carregar documentos</div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground/30">Nenhum documento encontrado</div>
                ) : (
                  filtered.map((doc, i) => (
                    <motion.div key={doc.id} className="grid grid-cols-[1.4fr_1fr_120px_120px] items-center px-5 py-4 hover:bg-muted/10 transition-colors cursor-pointer group" onClick={() => { setSelectedDoc(doc); setModalError(""); }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} whileHover={{ x: 2 }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <FileCheck className="w-4 h-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-foreground truncate">{doc.nome}</p>
                          <p className="text-[10px] text-muted-foreground/45 truncate">{doc.emailDestinatario || doc.tipo}</p>
                        </div>
                      </div>
                      <p className="text-[12px] text-foreground/65 truncate">{doc.nomeEmpresa || `Empresa #${doc.empresaId}`}</p>
                      <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full w-fit ${statusStyles[doc.validado] || "bg-muted/10 text-muted-foreground"}`}>{statusLabels[doc.validado] || doc.validado}</span>
                      <p className="text-[11px] text-muted-foreground/45">{formatDate(doc.dataUpload)}</p>
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
                  <h2 className="text-[16px] font-semibold text-foreground">Solicitar documento</h2>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">Envie um link de anexo para a empresa ou outro destinatário.</p>
                </div>
                <button onClick={() => setRequestOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Empresa</label>
                  <select value={selectedEmpresaId} onChange={(e) => handleEmpresaChange(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[12px] outline-none focus:border-accent/40 transition-colors text-foreground">
                    <option value="">Selecione a empresa</option>
                    {empresas.filter((empresa) => Number(empresa.id) > 0).map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Título do documento</label>
                  <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Contrato social atualizado" className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[12px] outline-none focus:border-accent/40 transition-colors text-foreground placeholder:text-muted-foreground/30" />
                </div>

                <div>
                  <label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Tipo ou categoria</label>
                  <input value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} placeholder="Opcional" className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[12px] outline-none focus:border-accent/40 transition-colors text-foreground placeholder:text-muted-foreground/30" />
                </div>

                <div>
                  <label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">E-mail para anexo</label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border/25 bg-background/50 focus-within:border-accent/40 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground/40" />
                    <input value={emailDestinatario} onChange={(e) => setEmailDestinatario(e.target.value)} placeholder={selectedEmpresa?.email || "email@empresa.com"} className="flex-1 bg-transparent text-[12px] outline-none text-foreground placeholder:text-muted-foreground/30" />
                  </div>
                </div>

                <button onClick={handleSolicitarDocumento} disabled={solicitarDocumento.isPending} className="w-full h-10 rounded-lg bg-accent text-accent-foreground text-[12px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send className="w-4 h-4" />
                  {solicitarDocumento.isPending ? "Enviando..." : "Enviar solicitação"}
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
                  <p className="text-[11px] text-muted-foreground/50">{selectedDoc.tipo}</p>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="rounded-xl border border-border/20 bg-background/50 p-5 space-y-3">
                  <p className="text-[10px] text-muted-foreground/40 font-medium tracking-[0.08em] uppercase">Detalhes</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-[10px] text-muted-foreground/40">Empresa</p><p className="text-[13px] text-foreground/80">{selectedDoc.nomeEmpresa || `Empresa #${selectedDoc.empresaId}`}</p></div>
                    <div><p className="text-[10px] text-muted-foreground/40">Status</p><p className="text-[13px] text-foreground/80">{statusLabels[selectedDoc.validado] || selectedDoc.validado}</p></div>
                    <div><p className="text-[10px] text-muted-foreground/40">Solicitado em</p><p className="text-[13px] text-foreground/80">{formatDate(selectedDoc.dataSolicitacao)}</p></div>
                    <div><p className="text-[10px] text-muted-foreground/40">Enviado em</p><p className="text-[13px] text-foreground/80">{formatDate(selectedDoc.dataEnvio)}</p></div>
                  </div>
                  <div><p className="text-[10px] text-muted-foreground/40">E-mail destinatário</p><p className="text-[13px] text-foreground/80">{selectedDoc.emailDestinatario || "-"}</p></div>
                </div>
                <button onClick={() => handleDownloadDocumento(selectedDoc)} disabled={!selectedDoc.caminho} className="w-full h-10 rounded-lg border border-accent/20 bg-accent/10 text-accent text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-accent/20 transition-colors disabled:opacity-45 disabled:cursor-not-allowed">
                  <Download className="w-4 h-4" /> Baixar documento
                </button>
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
