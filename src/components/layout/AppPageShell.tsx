import { AppMain } from "@/components/layout/AppMain";
import { AppSidebar } from "@/components/layout/AppSidebar";
import type { ReactNode } from "react";

import { AppHeaderUser } from "@/components/layout/AppHeaderUser";

import { useSidebarState } from "@/hooks/useSidebarState";

import { useAuthStore } from "@/store/useAuthStore";

interface AppPageShellProps {
  children: ReactNode;
}

export function AppPageShell({ children }: AppPageShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);
  const userName = basicUserData?.nomeCompleto || userData?.nomeCompleto || "Usuário";
  const userPhoto = basicUserData?.fotoPerfil || userData?.fotoPerfil || null;
  const userRole = basicUserData?.cargoNome || userData?.cargo || "Sem cargo";

  return (
    <div className="app-layout relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative z-10 flex min-h-screen">
        <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />

        <AppMain collapsed={sidebarCollapsed}>
          <header className="sticky top-0 z-20 flex h-16 items-center justify-end border-b border-border/20 bg-background/80 px-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[12px] font-semibold text-foreground">{userName}</p>
                <p className="text-[10px] text-muted-foreground">{userRole}</p>
              </div>
              <AppHeaderUser name={userName} photoUrl={userPhoto} />
            </div>
          </header>
          <div className="app-fade-enter">{children}</div>
        </AppMain>
      </div>
    </div>
  );
}
