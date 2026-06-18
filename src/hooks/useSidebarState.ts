import { useEffect, useState } from "react";

const SIDEBAR_COLLAPSED_KEY = "climb:sidebar-collapsed";

function readInitialSidebarState() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

export function useSidebarState() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readInitialSidebarState);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return [sidebarCollapsed, setSidebarCollapsed] as const;
}
