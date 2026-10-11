import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useContratoEquipe } from "./useContratoEquipe";
import { useContratoKanban, useContratoKanbanAbertura, type ContratoKanbanBoard } from "./useContratoKanban";
import { useContratosKanbanDisponiveis } from "./useContratos";

vi.mock("@/api", () => ({ api: { get: vi.fn() } }));
const clients: QueryClient[] = [];
const board: ContratoKanbanBoard = { contratoId: 12, gestor: true, podeEditar: true, participantes: [], usuariosDisponiveis: [], raias: [] };
const equipe = { contratoId: 12, configurada: true, lider: true, membros: [], usuariosDisponiveis: [], temporarios: [] };
const renderAbertura = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  clients.push(client);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, ...renderHook(() => {
    const usuarioId = useAuthStore(s => s.basicUserData?.id);
    return {
      lista: useContratosKanbanDisponiveis(usuarioId),
      abertura: useContratoKanbanAbertura(12, usuarioId),
      equipe: useContratoEquipe(12, false),
      board: useContratoKanban(12, usuarioId, false),
    };
  }, { wrapper }) };
};
beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ basicUserData: { id: 7 }, userData: null });
});
afterEach(() => {
  act(() => {
    clients.forEach(client => client.clear()); clients.length = 0;
    useAuthStore.setState({ basicUserData: null, userData: null });
  });
});

describe("abertura do Kanban em uma chamada", () => {
  it("abre equipe e quadro enquanto a lista de contratos ainda está carregando", async () => {
    vi.mocked(api.get).mockImplementation(url => url === "/contratos/kanban-resumos"
      ? new Promise(() => {}) : Promise.resolve({ data: { success: true, data: { equipe, board } } }));
    const { result } = renderAbertura();
    await waitFor(() => expect(result.current.board.data).toEqual(board));
    expect(result.current.equipe.data).toEqual(equipe);
    expect(result.current.lista.isLoading).toBe(true);
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenCalledWith("/contratos/12/kanban/abertura");
    expect(api.get).not.toHaveBeenCalledWith("/contratos/12/equipe");
    expect(api.get).not.toHaveBeenCalledWith("/contratos/12/kanban");
  });

  it("mantém o quadro fechado enquanto a equipe não foi selecionada", async () => {
    vi.mocked(api.get).mockImplementation(url => Promise.resolve({ data: url === "/contratos/kanban-resumos" ? []
      : { success: true, data: { equipe: { ...equipe, configurada: false }, board: null } } }));
    const { result } = renderAbertura();
    await waitFor(() => expect(result.current.equipe.data?.configurada).toBe(false));
    expect(result.current.board.data).toBeNull();
    expect(api.get).not.toHaveBeenCalledWith("/contratos/12/kanban");
  });

  it("não reaproveita equipe ou quadro de outro usuário ao trocar a sessão", async () => {
    vi.mocked(api.get).mockImplementation(url => url === "/contratos/kanban-resumos"
      ? new Promise(() => {}) : Promise.resolve({ data: { success: true, data: { equipe, board } } }));
    const { result, client } = renderAbertura();
    await waitFor(() => expect(result.current.board.data?.gestor).toBe(true));
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    act(() => { useAuthStore.setState({ basicUserData: { id: 8 } }); });
    await waitFor(() => expect(result.current.abertura.isLoading).toBe(true));
    expect(result.current.equipe.data).toBeUndefined();
    expect(result.current.board.data).toBeUndefined();
    expect(client.getQueryData(["contratos", 12, "kanban", 7])).toEqual(board);
  });
});
