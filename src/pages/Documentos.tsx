import { useState, useMemo } from "react";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, Calendar as CalendarIcon, Shield, Building2, Settings,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Search, FileCheck, X, Download, UserCheck, ScrollText
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { useDocumentos, Documento } from "@/services";

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

const Documentos = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const navigate = useNavigate();

  const { data: documentos = [], isLoading, error } = useDocumentos();

  const filtered = useMemo(() => {
    if (!documentos.length) return [];
    return documentos.filter(d =>
      d.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tipo?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, documentos]);

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)` }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <motion.aside className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className={`flex items-center h-16 border-b border-border/20 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
            {sidebarCollapsed ? <motion.div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center"><span className="text-accent font-bold text-xs">C</span></motion.div> : <ClimbLogo className="h-[16px] text-foreground" />}
          </div>
          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map(item => (
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

        {/* Main */}
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"}`}>
          <motion.header className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b border-border/20 bg-background/80 backdrop-blur-xl" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border/25 bg-card/30 backdrop-blur-sm text-muted-foreground/50 w-[280px]">
              <Search className="w-3.5 h-3.5" />
              <input type="text" placeholder="Buscar documentos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/30 text-foreground" />
            </div>
            <motion.div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center"><span className="text-accent font-semibold text-[11px]">RR</span></motion.div>
          </motion.header>

          <div className="px-6 pt-6 pb-2">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">Documentos</h1>
            <p className="text-[12px] text-muted-foreground/50 mt-0.5">Acompanhe o envio e status dos documentos de cada empresa.</p>
          </div>

          <div className="px-6 pb-6">
            <motion.div className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <div className="divide-y divide-border/10 max-h-[calc(100vh-220px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                {isLoading ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground/50">Carregando documentos...</div>
                ) : error ? (
                  <div className="py-12 text-center text-[12px] text-destructive">Erro ao carregar documentos</div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground/30">Nenhum documento encontrado</div>
                ) : (
                  filtered.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      className="px-5 py-4 hover:bg-muted/10 transition-colors cursor-pointer group"
                      onClick={() => setSelectedDoc(doc)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ x: 2 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-[12px] font-semibold text-foreground">{doc.nome}</p>
                          <p className="text-[11px] text-foreground/70 group-hover:text-accent transition-colors">{doc.tipo}</p>
                          <p className="text-[10px] text-muted-foreground/40 mt-1">{new Date(doc.dataUpload).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <Download className="w-5 h-5 text-muted-foreground/50 group-hover:text-accent transition-colors" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Detail Modal */}
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
                <motion.button onClick={() => setSelectedDoc(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><X className="w-4 h-4" /></motion.button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="rounded-xl border border-border/20 bg-background/50 p-5 space-y-3">
                  <p className="text-[10px] text-muted-foreground/40 font-medium tracking-[0.08em] uppercase">Detalhes</p>
                  <div className="space-y-2">
                    <div><p className="text-[10px] text-muted-foreground/40">Descrição</p><p className="text-[13px] text-foreground/80">{selectedDoc.descricao}</p></div>
                    <div><p className="text-[10px] text-muted-foreground/40">Data de Upload</p><p className="text-[13px] text-foreground/80">{new Date(selectedDoc.dataUpload).toLocaleDateString("pt-BR")}</p></div>
                    <div><p className="text-[10px] text-muted-foreground/40">Tipo</p><p className="text-[13px] text-foreground/80">{selectedDoc.tipo}</p></div>
                  </div>
                </div>
                <motion.button className="w-full h-10 rounded-lg border border-accent/20 bg-accent/10 text-accent text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-accent/20 transition-colors" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Download className="w-4 h-4" /> Baixar documento
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Documentos;
