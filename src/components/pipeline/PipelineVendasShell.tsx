import type { PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LogOut, Moon, Search, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/useAuthStore";

interface PipelineVendasShellProps extends PropsWithChildren {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  activePath?: string;
}

export const PipelineVendasShell = ({ search, onSearchChange, searchPlaceholder = "Buscar negócios...", activePath = "/pipeline-vendas", children }: PipelineVendasShellProps) => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const navigate = useNavigate();
  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);
  const userName = basicUserData?.nomeCompleto || userData?.nomeCompleto || userData?.pessoa?.nomeCompleto || "Usuário";
  const userPhoto = basicUserData?.fotoPerfil || userData?.fotoPerfil || userData?.pessoa?.fotoPerfil || null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0"><div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%)" }} /></div>
      <div className="relative z-10 flex min-h-screen">
        <motion.aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}`} initial={false} animate={{ x: 0 }}>
          <div className={`flex h-16 items-center border-b border-border/20 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>{sidebarCollapsed ? <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">C</div> : <ClimbLogo className="h-[16px] text-foreground" />}</div>
          <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
            <AppSidebarNav collapsed={sidebarCollapsed} />
          </nav>
          <div className="space-y-1 border-t border-border/20 px-2 py-3">
            <motion.button onClick={() => setIsDark(!isDark)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-muted/30 hover:text-foreground ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}><AnimatePresence mode="wait"><motion.span key={isDark ? "sun" : "moon"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</motion.span></AnimatePresence>{!sidebarCollapsed && <span className="text-[13px] font-medium">{isDark ? "Modo claro" : "Modo escuro"}</span>}</motion.button>
            <Link to="/"><motion.button className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground/50 hover:bg-destructive/5 hover:text-destructive ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}><LogOut className="h-[18px] w-[18px]" />{!sidebarCollapsed && <span className="text-[13px] font-medium">Sair</span>}</motion.button></Link>
          </div>
          <button type="button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border/40 bg-card text-muted-foreground shadow-sm">{sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}</button>
        </motion.aside>

        <main className={`min-w-0 flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"}`}>
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/20 bg-background/80 px-6 backdrop-blur-xl">
            <div className="flex h-9 w-[300px] items-center gap-2 rounded-lg border border-border/25 bg-card/30 px-3"><Search className="h-3.5 w-3.5 text-muted-foreground/50" /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/30" /></div>
            <UserAvatar name={userName} photoUrl={userPhoto} />
          </header>
          {children}
        </main>
      </div>
    </div>
  );
};
