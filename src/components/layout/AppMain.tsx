import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function AppMain({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.main
      className="app-main"
      data-collapsed={collapsed}
      layout={reduceMotion ? false : "position"}
      layoutDependency={collapsed}
    >
      {children}
    </motion.main>
  );
}
