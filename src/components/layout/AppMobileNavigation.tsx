import { useEffect, useId, useRef } from "react";
import { Menu, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import { AppNavigationActions } from "@/components/layout/AppSidebar";

export const AppMobileNavigation = () => {
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  const { pathname } = useLocation();
  const close = () => { if (dialog.current?.open) dialog.current.close(); };

  useEffect(() => { if (dialog.current?.open) dialog.current.close(); }, [pathname]);
  useEffect(() => {
    const breakpoint = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (breakpoint.matches && dialog.current?.open) dialog.current.close(); };
    breakpoint.addEventListener("change", onResize);
    return () => breakpoint.removeEventListener("change", onResize);
  }, []);

  return (
    <>
      <button type="button" className="app-icon-button lg:hidden" aria-label="Abrir navegação" aria-haspopup="dialog" aria-controls={dialogId}
        onClick={(event) => {
          if (!dialog.current) return;
          dialog.current.dataset.instant = String(event.detail === 0);
          dialog.current.showModal();
        }}><Menu className="h-5 w-5" aria-hidden="true" /></button>
      <dialog ref={dialog} id={dialogId} className="app-mobile-navigation" aria-label="Navegação principal"
        onCancel={() => { if (dialog.current) dialog.current.dataset.instant = "true"; }}
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
        <div className="flex h-full flex-col" onClick={(event) => event.stopPropagation()}>
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-5">
            <ClimbLogo className="h-5 text-foreground" />
            <button type="button" onClick={close} className="app-icon-button" aria-label="Fechar navegação" autoFocus>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Páginas do sistema" className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
            <AppSidebarNav collapsed={false} onNavigate={close} />
          </nav>
          <AppNavigationActions />
        </div>
      </dialog>
    </>
  );
};
