import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BriefcaseBusiness, ChevronDown, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { preloadRoute } from "@/routes/lazyPages";
import {
  type MainNavItem,
  useVisibleMainNavItems,
} from "@/hooks/useVisibleMainNavItems";

interface AppSidebarNavProps {
  collapsed: boolean;
}

const commercialPaths = new Set([
  "/pipeline-vendas",
  "/pipeline-vendas/dashboard",
  "/pipeline-vendas/motivos-perda",
  "/pipeline-vendas/campanhas",
  "/pipeline-vendas/scripts",
  "/pipeline-vendas/funis",
]);

const settingsPaths = new Set(["/permissoes", "/cargos", "/cargos/hierarquia"]);

function routeIsActive(currentPath: string, itemPath: string) {
  if (itemPath === "/dashboard") return currentPath === itemPath;
  if (itemPath === "/contratos") return currentPath === itemPath;
  if (itemPath === "/pipeline-vendas") return currentPath === itemPath;
  if (itemPath === "/cargos") return currentPath === itemPath;
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export function AppSidebarNav({ collapsed }: AppSidebarNavProps) {
  const items = useVisibleMainNavItems();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const commercialActive = pathname.startsWith("/pipeline-vendas");
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
      <motion.button
        key={item.path}
        type="button"
        onMouseEnter={() => preloadRoute(item.path)}
        onFocus={() => preloadRoute(item.path)}
        onClick={() => navigate(item.path)}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-lg py-2.5 text-left transition-all",
          collapsed ? "justify-center px-2" : child ? "pl-9 pr-3" : "px-3",
          active
            ? "bg-accent/10 text-accent"
            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
        )}
        whileHover={{ x: collapsed ? 0 : 2 }}
        whileTap={{ scale: 0.98 }}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
        )}
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="truncate text-[13px] font-medium">{item.label}</span>}
      </motion.button>
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
          title={collapsed ? label : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg py-2.5 transition-colors",
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
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
            </>
          )}
        </button>
        {open && <div className="space-y-1">{groupItems.map((item) => renderItem(item, true))}</div>}
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
