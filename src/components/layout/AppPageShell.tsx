import { AppMain } from "@/components/layout/AppMain";
import { AppSidebar } from "@/components/layout/AppSidebar";
import type { ReactNode } from "react";

import { AppHeaderUser } from "@/components/layout/AppHeaderUser";

import { useSidebarState } from "@/hooks/useSidebarState";

interface AppPageShellProps {
  children: ReactNode;
}

export function AppPageShell({ children }: AppPageShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();

  return (
    <div className="app-layout relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative z-10 flex min-h-screen">
        <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />

        <AppMain collapsed={sidebarCollapsed}>
          <header className="sticky top-0 z-20 flex h-16 items-center justify-end border-b border-border/20 bg-background/80 px-6 backdrop-blur-xl">
            <AppHeaderUser />
          </header>
          <div className="app-fade-enter">{children}</div>
        </AppMain>
      </div>
    </div>
  );
}
