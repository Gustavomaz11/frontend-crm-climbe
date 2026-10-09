import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useContratoEquipe } from "./useContratoEquipe";
vi.mock("@/api", () => ({ api: { get: vi.fn() } }));
afterEach(() => { useAuthStore.setState({ basicUserData: null, userData: null }); vi.clearAllMocks(); });
describe("permissões da equipe no cache", () => {
  it("não apresenta outro usuário como líder ao trocar a sessão", async () => {
    useAuthStore.setState({ basicUserData: { id: 7 }, userData: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    client.setQueryData(["contratos", 12, "equipe", 7], { lider: true, configurada: true });
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result, unmount } = renderHook(() => useContratoEquipe(12), { wrapper });
    expect(result.current.data?.lider).toBe(true);
    act(() => { useAuthStore.setState({ basicUserData: { id: 8 } }); });
    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(result.current.data).toBeUndefined();
    unmount(); client.clear();
  });
});
