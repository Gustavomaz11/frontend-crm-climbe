import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { useContratoKanban, useCreateKanbanTask, type ContratoKanbanBoard, type KanbanTaskDTO } from "./useContratoKanban";

vi.mock("@/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const queryKey = ["contratos", 1, "kanban"];
const board: ContratoKanbanBoard = {
  contratoId: 1,
  gestor: true,
  participantes: [],
  usuariosDisponiveis: [],
  raias: [{ id: 20, titulo: "A fazer", posicao: 0, tasks: [] }],
};
const input: KanbanTaskDTO = { raiaId: 20, titulo: "Analisar documentos", prioridade: "MEDIA", responsavelId: null };
const clients: QueryClient[] = [];

const renderKanban = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  client.setQueryData(queryKey, board);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, ...renderHook(() => ({ board: useContratoKanban(1), create: useCreateKanbanTask() }), { wrapper }) };
};

beforeEach(() => vi.resetAllMocks());
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

describe("criação de tarefas do Kanban", () => {
  it("não reutiliza permissões do quadro de outro usuário", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    clients.push(client);
    client.setQueryData([...queryKey, 7], { ...board, podeEditar: true });
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result, rerender } = renderHook(({ usuarioId }) => useContratoKanban(1, usuarioId), { initialProps: { usuarioId: 7 }, wrapper });
    expect(result.current.data?.podeEditar).toBe(true);
    rerender({ usuarioId: 8 });
    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it("exibe a tarefa confirmada enquanto a atualização do quadro ainda está pendente", async () => {
    const createdBoard: ContratoKanbanBoard = {
      ...board,
      raias: [{ ...board.raias[0], tasks: [{ id: 30, ...input, prioridade: "MEDIA", posicao: 0, subtarefas: [] }] }],
    };
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: createdBoard } });
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    const { client, result } = renderKanban();
    const anotherBoard = { ...board, contratoId: 2 };
    client.setQueryData(["contratos", 2, "kanban"], anotherBoard);

    await act(async () => { await result.current.create.mutateAsync({ contratoId: 1, data: input }); });

    await waitFor(() => expect(result.current.board.data?.raias[0].tasks).toHaveLength(1));
    expect(result.current.board.data?.raias[0].tasks[0]).toMatchObject({ id: 30, titulo: input.titulo });
    expect(result.current.board.isFetching).toBe(true);
    expect(api.get).toHaveBeenCalledWith("/contratos/1/kanban");
    expect(client.getQueryData(["contratos", 2, "kanban"])).toEqual(anotherBoard);
  });

  it("preserva o quadro quando a API recusa o salvamento", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("Não foi possível criar a tarefa."));
    const { result } = renderKanban();

    await act(async () => {
      await expect(result.current.create.mutateAsync({ contratoId: 1, data: input })).rejects.toThrow("Não foi possível criar a tarefa.");
    });

    expect(result.current.board.data).toEqual(board);
    expect(api.get).not.toHaveBeenCalled();
  });
});
