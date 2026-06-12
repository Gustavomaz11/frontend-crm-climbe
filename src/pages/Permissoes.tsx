import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, Calendar as CalendarIcon, Shield, Building2, Settings,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Search, Bell, FileCheck, UserCheck, ScrollText
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { usePermissoes } from "@/services";
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

const Permissoes = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Fetch permissoes from API
  const { data: permissoes = [], isLoading, error } = usePermissoes();

  const filtered = permissoes.filter(p => 
    p.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)` }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <motion.aside className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className={`flex items-center h-16 border-b border-border/20 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
            {sidebarCollapsed ? (
              <motion.div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center"><span className="text-accent font-bold text-xs">C</span></motion.div>
            ) : (
              <ClimbLogo className="h-[16px] text-foreground" />
            )}
          </div>
          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map((item) => (
              <motion.button key={item.label} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-3 rounded-lg transition-all group relative ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"} ${item.label === "Permissões" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`} whileHover={{ x: sidebarCollapsed ? 0 : 2 }} whileTap={{ scale: 0.98 }}>
                {item.label === "Permissões" && <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" layoutId="activeNav" />}
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border/25 bg-card/30 backdrop-blur-sm text-muted-foreground/50 w-[240px]">
                <Search className="w-3.5 h-3.5" />
                <input type="text" placeholder="Buscar permissão..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/30 text-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center" whileHover={{ scale: 1.03 }}>
                <span className="text-accent font-semibold text-[11px]">RR</span>
              </motion.div>
              <div className="text-right">
                <p className="text-[12px] font-medium text-foreground">Analista</p>
                <p className="text-[10px] text-muted-foreground/40">analista@climb.com</p>
              </div>
            </div>
          </motion.header>

          <div className="px-6 pt-6 pb-2">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">Gerenciamento de Permissões</h1>
            <p className="text-[12px] text-muted-foreground/50 mt-0.5">Gerencie as permissões dos usuários.</p>
          </div>

          <div className="px-6 pb-6">
            <motion.div className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-border/15">
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground/50 tracking-wider uppercase w-[320px] sticky left-0 bg-card/90 backdrop-blur-sm z-10">Permissões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-[12px] text-muted-foreground/30">
                          {isLoading ? "Carregando permissões..." : error ? "Erro ao carregar" : "Nenhuma permissão encontrada"}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((perm, pi) => (
                        <motion.tr
                          key={perm.id}
                          className="border-b border-border/8 hover:bg-muted/10 transition-colors"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: pi * 0.03 }}
                        >
                          <td className="px-4 py-3 text-[11px] text-foreground/80 leading-relaxed sticky left-0 bg-card/90 backdrop-blur-sm z-10">
                            <div>
                              <p className="font-medium">{perm.nome}</p>
                              <p className="text-muted-foreground/40 text-[9px]">{perm.descricao}</p>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Permissoes;
