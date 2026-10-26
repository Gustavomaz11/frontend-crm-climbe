import { fireEvent, render, screen } from "@testing-library/react";
import { Home, Settings, TrendingUp } from "lucide-react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppSidebarNav } from "./AppSidebarNav";

vi.mock("@/hooks/useVisibleMainNavItems", () => ({ useVisibleMainNavItems: () => [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/pipeline-pre-vendas", label: "Pré-vendas", icon: TrendingUp },
  { path: "/pipeline-vendas/cadastros", label: "Tags e campos", icon: Settings },
  { path: "/cargos", label: "Cargos", icon: Settings },
  { path: "/configuracoes/convite", label: "Convite", icon: Settings },
  { path: "/cargos/hierarquia", label: "Hierarquia de cargos", icon: Settings },
] }));
vi.mock("@/routes/lazyPages", () => ({ preloadRoute: vi.fn() }));

describe("navegação do sistema", () => {
  it("inclui Convite em Configurações e abre o grupo na rota atual", () => {
    render(<MemoryRouter initialEntries={["/configuracoes/convite"]}><AppSidebarNav collapsed={false} /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Configurações" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Convite" })).toHaveAttribute("aria-current", "page");
  });
  it("retira os links da navegação por teclado assim que um grupo começa a fechar", () => {
    render(<MemoryRouter initialEntries={["/pipeline-vendas/cadastros"]}><AppSidebarNav collapsed={false} /></MemoryRouter>);
    const link = screen.getByRole("link", { name: "Tags e campos" });
    fireEvent.click(screen.getByRole("button", { name: "Comercial" }));
    expect(screen.queryByRole("link", { name: "Tags e campos" })).not.toBeInTheDocument();
    expect(!link.isConnected || link.closest("[inert]") !== null).toBe(true);
  });

  it("agrupa pré-vendas e cadastros no Comercial e identifica a rota atual", () => {
    const onNavigate = vi.fn();
    render(<MemoryRouter initialEntries={["/pipeline-vendas/cadastros"]}><AppSidebarNav collapsed={false} onNavigate={onNavigate} /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Comercial" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Tags e campos" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("link", { name: "Pré-vendas" }));
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Pré-vendas" })).toHaveAttribute("aria-current", "page");
  });

  it("mantém nomes acessíveis recolhido e marca apenas a hierarquia como ativa", () => {
    render(<MemoryRouter initialEntries={["/cargos/hierarquia"]}><AppSidebarNav collapsed /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Hierarquia de cargos" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Cargos" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/dashboard");
  });
});
