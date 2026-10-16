import { useContext } from "react";
import { ChevronLeft, ChevronRight, LogOut, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import { AuthContext } from "@/context/provider";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export const AppNavigationActions = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { isDark, setIsDark } = useTheme();
  const auth = useContext(AuthContext);
  const themeLabel = isDark ? "Modo claro" : "Modo escuro";
  const ThemeIcon = isDark ? Sun : Moon;

  return (
    <div className="space-y-1 border-t border-border/60 p-3">
      <button type="button" aria-label={themeLabel} title={collapsed ? themeLabel : undefined}
        onClick={() => setIsDark(!isDark)} className={cn("app-nav-action", collapsed && "justify-center")}>
        <ThemeIcon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        {!collapsed && <span>{themeLabel}</span>}
      </button>
      <button type="button" aria-label="Sair" title={collapsed ? "Sair" : undefined}
        onClick={() => auth?.signOut()} className={cn("app-nav-action hover:bg-destructive/10 hover:text-destructive", collapsed && "justify-center")}>
        <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        {!collapsed && <span>Sair</span>}
      </button>
    </div>
  );
};

export const AppSidebar = ({ collapsed, onCollapsedChange }: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) => (
  <aside className="app-sidebar" data-collapsed={collapsed} aria-label="Navegação principal">
    <div className={cn("flex h-16 shrink-0 items-center border-b border-border/60", collapsed ? "justify-center px-2" : "px-6")}>
      <Link to="/dashboard" aria-label="Climb, página inicial" className="rounded-md p-1">
        {collapsed ? <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">C</span>
          : <ClimbLogo className="h-5 text-foreground" />}
      </Link>
    </div>
    <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label="Páginas do sistema">
      <AppSidebarNav collapsed={collapsed} />
    </nav>
    <AppNavigationActions collapsed={collapsed} />
    <button type="button" onClick={() => onCollapsedChange(!collapsed)}
      aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"} aria-expanded={!collapsed}
      className="absolute -right-4 top-20 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground">
      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </button>
  </aside>
);
