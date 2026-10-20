import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useContratoKanban, useContratoKanbanAbertura, useMoveKanbanTask, type ContratoKanbanBoard } from "./useContratoKanban";

vi.mock("@/api", () => ({ api: { get: vi.fn(), patch: vi.fn() } }));
const clients: QueryClient[] = [];
const board = (servico: string, id: number): ContratoKanbanBoard => ({
  contratoId: 10, servico, gestor: true, participantes: [], usuariosDisponiveis: [],
  raias: [{ id, titulo: "A fazer", posicao: 0, tasks: [{ id: id + 100, raiaId: id, titulo: servico, prioridade: "MEDIA", posicao: 0, subtarefas: [] }] },
    { id: id + 1, titulo: "Em andamento", posicao: 1, tasks: [] }],
});
const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
};
beforeEach(() => { vi.resetAllMocks(); useAuthStore.setState({ basicUserData: { id: 7 }, userData: null }); });
afterEach(() => { clients.forEach(client => client.clear()); clients.length = 0; useAuthStore.setState({ basicUserData: null, userData: null }); });

describe("cache do Kanban por serviço", () => {
  it("troca de serviço sem exibir o quadro anterior durante o carregamento", async () => {
    const contabil = board("CONTABILIDADE", 1); const cfo = board("CFO", 3);
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { equipe: { configurada: true }, board: contabil } } });
    const { client, wrapper } = setup();
    const { result, rerender } = renderHook(({ servico }) => ({
      abertura: useContratoKanbanAbertura(10, 7, servico), board: useContratoKanban(10, 7, false, servico),
    }), { initialProps: { servico: "CONTABILIDADE" }, wrapper });
    await waitFor(() => expect(result.current.board.data).toEqual(contabil));
    let finish: (value: unknown) => void = () => {};
    vi.mocked(api.get).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    rerender({ servico: "CFO" });
    expect(result.current.board.data).toBeUndefined();
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith("/contratos/10/kanban/abertura", { params: { servico: "CFO" } }));
    await act(async () => finish({ data: { success: true, data: { equipe: { configurada: true }, board: cfo } } }));
    await waitFor(() => expect(result.current.board.data).toEqual(cfo));
    expect(client.getQueryData(["contratos", 10, "kanban", 7, "servico", "CONTABILIDADE"])).toEqual(contabil);
    rerender({ servico: "CONTABILIDADE" });
    expect(result.current.board.data).toEqual(contabil);
  });

  it("movimenta e restaura apenas o quadro do serviço selecionado quando a API falha", async () => {
    const { client, wrapper } = setup();
    const contabil = board("CONTABILIDADE", 1); const cfo = board("CFO", 3);
    const contabilKey = ["contratos", 10, "kanban", 7, "servico", "CONTABILIDADE"];
    const cfoKey = ["contratos", 10, "kanban", 7, "servico", "CFO"];
    client.setQueryData(contabilKey, contabil); client.setQueryData(cfoKey, cfo);
    let reject: (reason: Error) => void = () => {};
    vi.mocked(api.patch).mockImplementation(() => new Promise((_resolve, fail) => { reject = fail; }));
    const { result } = renderHook(() => useMoveKanbanTask(), { wrapper });
    act(() => result.current.mutate({ contratoId: 10, servico: "CFO", taskId: 103, data: { raiaId: 4 } }));
    await waitFor(() => expect(client.getQueryData<ContratoKanbanBoard>(cfoKey)?.raias[1].tasks).toHaveLength(1));
    expect(client.getQueryData(contabilKey)).toEqual(contabil);
    await act(async () => reject(new Error("Falha de rede")));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(cfoKey)).toEqual(cfo); expect(client.getQueryData(contabilKey)).toEqual(contabil);
  });
});
