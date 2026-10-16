import { useEffect, useSyncExternalStore } from "react";

const readTheme = () => localStorage.getItem("climb-theme") !== "light";
const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener("climb:theme-change", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("climb:theme-change", notify);
  };
};
const setIsDark = (value: boolean) => {
  localStorage.setItem("climb-theme", value ? "dark" : "light");
  document.documentElement.classList.toggle("dark", value);
  window.dispatchEvent(new Event("climb:theme-change"));
};

export function useTheme() {
  const isDark = useSyncExternalStore(subscribe, readTheme, () => true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return { isDark, setIsDark };
}
