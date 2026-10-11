import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { useVisibleMainNavItems } from "./useVisibleMainNavItems";

const mocks = vi.hoisted(() => ({ codes: [] as string[] }));
vi.mock("@/api", () => ({ api: { get: vi.fn() } }));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ basicUserData: { id: 7 } }) }));
vi.mock("@/services", () => ({ useUsuarioPermissoes: () => ({ data: mocks.codes.map(codigo => ({ permissao: { codigo } })), isLoading: false }) }));
const clients: QueryClient[] = [];
const renderNav = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useVisibleMainNavItems(), { wrapper });
};
beforeEach(() => { mocks.codes = []; vi.clearAllMocks(); });
afterEach(() => { clients.forEach(client => client.clear()); clients.length = 0; });

describe("consulta leve de acesso ao menu Kanban", () => {
  it("mostra o menu para membros usando somente uma resposta booleana", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: true });
    const { result } = renderNav();
    await waitFor(() => expect(result.current.map(item => item.path)).toContain("/contratos/kanban"));
    expect(api.get).toHaveBeenCalledWith("/contratos/kanban-acesso");
    expect(api.get).not.toHaveBeenCalledWith("/contratos/kanban-disponiveis");
  });

  it("não busca contratos para quem já possui permissão global do menu", () => {
    mocks.codes = ["CONTRATO_KANBAN"];
    const { result } = renderNav();
    expect(result.current.map(item => item.path)).toContain("/contratos/kanban");
    expect(api.get).not.toHaveBeenCalled();
  });

  it("não mostra o menu para quem não possui contratos disponíveis nem permissão", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: false });
    const { result } = renderNav();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/contratos/kanban-acesso"));
    expect(result.current.map(item => item.path)).not.toContain("/contratos/kanban");
  });
});
