import { AppSidebar } from "@/components/layout/AppSidebar";
import type { PropsWithChildren } from "react";

import { Search } from "lucide-react";

import { AppHeaderUser } from "@/components/layout/AppHeaderUser";

import { useSidebarState } from "@/hooks/useSidebarState";

import { useAuthStore } from "@/store/useAuthStore";

interface PipelineVendasShellProps extends PropsWithChildren {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  activePath?: string;
}

export const PipelineVendasShell = ({ search, onSearchChange, searchPlaceholder = "Buscar negócios...", activePath = "/pipeline-vendas", children }: PipelineVendasShellProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);
  const userName = basicUserData?.nomeCompleto || userData?.nomeCompleto || userData?.pessoa?.nomeCompleto || "Usuário";
  const userPhoto = basicUserData?.fotoPerfil || userData?.fotoPerfil || userData?.pessoa?.fotoPerfil || null;

  return (
    <div className="app-layout relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0"><div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%)" }} /></div>
      <div className="relative z-10 flex min-h-screen">
        <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />

        <main className="app-main" data-collapsed={sidebarCollapsed}>
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/20 bg-background/80 px-6 backdrop-blur-xl">
            <div className="flex h-9 w-full min-w-0 max-w-[300px] items-center gap-2 rounded-lg border border-border/25 bg-card/30 px-3"><Search className="h-3.5 w-3.5 text-muted-foreground" /><input aria-label={searchPlaceholder} type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground" /></div>
            <AppHeaderUser name={userName} photoUrl={userPhoto} />
          </header>
          {children}
        </main>
      </div>
    </div>
  );
};
