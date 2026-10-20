import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useContratoEquipe, useSalvarContratoEquipe, type ContratoEquipe } from "./useContratoEquipe";
import { useContratoKanbanAbertura } from "./useContratoKanban";

vi.mock("@/api", () => ({ api: { get: vi.fn(), put: vi.fn() } }));
const cfo: ContratoEquipe = { contratoId: 1, servico: "CFO", configurada: true, lider: true,
  membros: [{ id: 7, nomeCompleto: "CFO" }], usuariosDisponiveis: [], temporarios: [] };
const contabil: ContratoEquipe = { ...cfo, servico: "CONTABILIDADE", lider: false, membros: [{ id: 8, nomeCompleto: "Contábil" }] };
const clients: QueryClient[] = [];
const preparar = () => {
  vi.resetAllMocks();
  useAuthStore.setState({ basicUserData: { id: 7 }, userData: null });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  clients.push(client);
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
};
afterEach(() => {
  act(() => { useAuthStore.setState({ basicUserData: null, userData: null }); });
  clients.forEach(client => client.clear()); clients.length = 0;
});

describe("permissões da equipe no cache", () => {
  it("não apresenta outro usuário como líder ao trocar a sessão", async () => {
    const { wrapper, client } = preparar();
    client.setQueryData(["contratos", 12, "equipe", 7], { lider: true, configurada: true });
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    const { result, unmount } = renderHook(() => useContratoEquipe(12), { wrapper });
    expect(result.current.data?.lider).toBe(true);
    act(() => { useAuthStore.setState({ basicUserData: { id: 8 } }); });
    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(result.current.data).toBeUndefined();
    unmount();
  });
});

describe("equipe isolada por serviço", () => {
  it("trocar de quadro não reaproveita a equipe ou liderança do outro serviço", async () => {
    const { wrapper, client } = preparar();
    vi.mocked(api.get).mockResolvedValueOnce({ data: cfo }).mockResolvedValueOnce({ data: contabil });
    const { result, rerender } = renderHook(({ servico }) => useContratoEquipe(1, true, servico), {
      initialProps: { servico: "CFO" }, wrapper,
    });
    await waitFor(() => expect(result.current.data).toEqual(cfo));
    rerender({ servico: "CONTABILIDADE" });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toEqual(contabil));
    expect(api.get).toHaveBeenLastCalledWith("/contratos/1/equipe", { params: { servico: "CONTABILIDADE" } });
    expect(client.getQueryData(["contratos", 1, "equipe", 7, "servico", "CFO"])).toEqual(cfo);
  });

  it("a abertura do Kanban preenche apenas o cache da equipe do serviço aberto", async () => {
    const { wrapper, client } = preparar();
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { equipe: cfo, board: null } } });
    const { result } = renderHook(() => useContratoKanbanAbertura(1, 7, "CFO"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(["contratos", 1, "equipe", 7, "servico", "CFO"])).toEqual(cfo);
    expect(client.getQueryData(["contratos", 1, "equipe", 7, "servico", "CONTABILIDADE"])).toBeUndefined();
  });

  it("salvar o CFO envia o serviço e preserva a equipe contábil no cache", async () => {
    const { wrapper, client } = preparar();
    client.setQueryData(["contratos", 1, "equipe", 7, "servico", "CONTABILIDADE"], contabil);
    vi.mocked(api.put).mockResolvedValue({ data: cfo });
    const { result } = renderHook(() => useSalvarContratoEquipe(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ id: 1, usuarioIds: [7], servico: "CFO" }); });
    expect(api.put).toHaveBeenCalledWith("/contratos/1/equipe", { usuarioIds: [7] }, { params: { servico: "CFO" } });
    expect(client.getQueryData(["contratos", 1, "equipe", 7, "servico", "CONTABILIDADE"])).toEqual(contabil);
  });
});
