import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTheme } from "./use-theme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("tema compartilhado", () => {
  it("sincroniza os controles do menu móvel e do desktop e persiste a escolha", () => {
    const desktop = renderHook(useTheme);
    const mobile = renderHook(useTheme);
    act(() => mobile.result.current.setIsDark(false));
    expect(desktop.result.current.isDark).toBe(false);
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem("climb-theme")).toBe("light");
    act(() => desktop.result.current.setIsDark(true));
    expect(mobile.result.current.isDark).toBe(true);
    expect(document.documentElement).toHaveClass("dark");
  });

  it("restaura o tema salvo e acompanha mudanças de outra aba", () => {
    localStorage.setItem("climb-theme", "light");
    const { result } = renderHook(useTheme);
    expect(result.current.isDark).toBe(false);
    act(() => {
      localStorage.setItem("climb-theme", "dark");
      window.dispatchEvent(new StorageEvent("storage", { key: "climb-theme", newValue: "dark" }));
    });
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement).toHaveClass("dark");
  });
});
