import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { BriefcaseBusiness, ChevronDown, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { preloadRoute } from "@/routes/lazyPages";
import {
  type MainNavItem,
  useVisibleMainNavItems,
} from "@/hooks/useVisibleMainNavItems";

interface AppSidebarNavProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

const commercialPaths = new Set([
  "/pipeline-vendas",
  "/pipeline-vendas/dashboard",
  "/pipeline-vendas/motivos-perda",
  "/pipeline-vendas/campanhas",
  "/pipeline-vendas/scripts",
  "/pipeline-vendas/funis",
  "/pipeline-vendas/cadastros",
  "/pipeline-pre-vendas",
]);

const settingsPaths = new Set(["/permissoes", "/cargos", "/cargos/hierarquia"]);

function routeIsActive(currentPath: string, itemPath: string) {
  if (itemPath === "/dashboard") return currentPath === itemPath;
  if (itemPath === "/contratos") return currentPath === itemPath;
  if (itemPath === "/pipeline-vendas") return currentPath === itemPath;
  if (itemPath === "/cargos") return currentPath === itemPath;
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

function NavGroupContent({ children }: { children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const present = useIsPresent();
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => { content.current?.toggleAttribute("inert", !present); }, [present]);

  return <motion.div
    ref={content}
    aria-hidden={!present}
    className="overflow-hidden"
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: "auto", opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: reduceMotion ? 0 : 0.18 }}
  ><div className="space-y-1">{children}</div></motion.div>;
}

export function AppSidebarNav({ collapsed, onNavigate }: AppSidebarNavProps) {
  const items = useVisibleMainNavItems();
  const { pathname } = useLocation();
  const commercialActive = [...commercialPaths].some((path) => routeIsActive(pathname, path));
  const settingsActive = settingsPaths.has(pathname);
  const [commercialOpen, setCommercialOpen] = useState(commercialActive);
  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  useEffect(() => {
    if (commercialActive) setCommercialOpen(true);
    if (settingsActive) setSettingsOpen(true);
  }, [commercialActive, settingsActive]);

  const groups = useMemo(() => ({
    commercial: items.filter((item) => commercialPaths.has(item.path)),
    settings: items.filter((item) => settingsPaths.has(item.path)),
    primary: items.filter(
      (item) => !commercialPaths.has(item.path) && !settingsPaths.has(item.path),
    ),
  }), [items]);

  const renderItem = (item: MainNavItem, child = false) => {
    const active = routeIsActive(pathname, item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        onMouseEnter={() => preloadRoute(item.path)}
        onFocus={() => preloadRoute(item.path)}
        onClick={onNavigate}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        className={cn(
          "app-nav-link group relative flex min-h-11 w-full items-center gap-3 rounded-lg py-2.5 text-left",
          collapsed ? "justify-center px-2" : child ? "pl-9 pr-3" : "px-3",
          active
            ? "bg-accent/10 text-accent"
            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
        )}
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="app-nav-label truncate text-[13px] font-medium">{item.label}</span>}
      </Link>
    );
  };

  const renderGroup = (
    label: string,
    icon: typeof BriefcaseBusiness,
    groupItems: MainNavItem[],
    open: boolean,
    active: boolean,
    toggle: () => void,
  ) => {
    if (groupItems.length === 0) return null;
    const Icon = icon;
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={toggle}
          aria-label={label}
          aria-expanded={open}
          title={collapsed ? label : undefined}
          className={cn(
            "app-nav-link flex min-h-11 w-full items-center gap-3 rounded-lg py-2.5",
            collapsed ? "justify-center px-2" : "px-3",
            active
              ? "bg-accent/10 text-accent"
              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
          )}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-[13px] font-medium">{label}</span>
              <ChevronDown className={cn("app-nav-chevron h-3.5 w-3.5", open && "rotate-180")} />
            </>
          )}
        </button>
        <AnimatePresence initial={false}>
          {open && <NavGroupContent key={label}>{groupItems.map((item) => renderItem(item, true))}</NavGroupContent>}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {groups.primary.slice(0, 3).map((item) => renderItem(item))}
      {renderGroup(
        "Comercial",
        BriefcaseBusiness,
        groups.commercial,
        commercialOpen,
        commercialActive,
        () => setCommercialOpen((current) => !current),
      )}
      {groups.primary.slice(3).map((item) => renderItem(item))}
      {renderGroup(
        "Configurações",
        Settings,
        groups.settings,
        settingsOpen,
        settingsActive,
        () => setSettingsOpen((current) => !current),
      )}
    </div>
  );
}
