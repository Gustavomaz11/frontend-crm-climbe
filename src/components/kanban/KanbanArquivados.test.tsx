import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KanbanArquivados, KanbanArquivarButton } from "./KanbanArquivados";
import type { KanbanArquivoContexto } from "@/services/useKanbanArquivos";

const mocks = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock("@/api", () => ({ api: { get: mocks.get, patch: mocks.patch } }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ basicUserData: { id: 3 } }) }));
const contexto: KanbanArquivoContexto = { tipo: "NEGOCIO", funilId: 12 };
let client: QueryClient;
let items: { id: number; titulo: string; coluna: string; responsaveis: string; arquivadoEm: string; item: { id: number } }[];

beforeEach(() => {
  vi.clearAllMocks();
  items = [{ id: 7, titulo: "Contrato Empresa", coluna: "Ganho", responsaveis: "Ana", arquivadoEm: "2026-11-16T10:00:00", item: { id: 7 } }];
  mocks.get.mockImplementation(async () => ({ data: [...items] }));
  mocks.patch.mockImplementation(async () => { items = []; return { data: null }; });
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
});
afterEach(() => { cleanup(); client.clear(); });

const abrir = async (canRestore = true, onOpen?: (item: { id: number }) => void) => {
  render(<QueryClientProvider client={client}><KanbanArquivados contexto={contexto} canRestore={canRestore} onOpen={onOpen} /></QueryClientProvider>);
  expect(mocks.get).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Arquivados" }));
  await screen.findByText("Contrato Empresa");
  return screen.getByRole("alertdialog");
};

describe("arquivados dos kanbans", () => {
  it("carrega os arquivos do quadro e permite desarquivar sem mudar a coluna", async () => {
    const dialog = await abrir();
    expect(mocks.get).toHaveBeenCalledWith("/pipeline-vendas/arquivados", { params: { funilId: 12, negocioId: undefined } });
    expect(dialog).toHaveTextContent("Ganho · Ana");
    expect(dialog).toHaveTextContent("mais 15 dias");
    fireEvent.click(within(dialog).getByRole("button", { name: "Desarquivar Contrato Empresa" }));
    await waitFor(() => expect(mocks.patch).toHaveBeenCalledWith("/pipeline-vendas/negocios/7/arquivamento", { arquivado: false }));
    await screen.findByText("Nenhum item arquivado encontrado.");
    expect(mocks.success).toHaveBeenCalled();
  });

  it("permite consultar o item e pesquisar por responsável", async () => {
    const onOpen = vi.fn();
    const dialog = await abrir(true, onOpen);
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar itens arquivados" }), { target: { value: "outro" } });
    expect(screen.queryByText("Contrato Empresa")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar itens arquivados" }), { target: { value: "ANA" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Abrir" }));
    expect(onOpen).toHaveBeenCalledWith({ id: 7 });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("preserva a listagem e mostra a mensagem da API quando não pode restaurar", async () => {
    mocks.patch.mockRejectedValue({ isAxiosError: true, response: { data: { message: "Sem permissão para editar." } } });
    const dialog = await abrir();
    fireEvent.click(within(dialog).getByRole("button", { name: "Desarquivar Contrato Empresa" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Sem permissão para editar."));
    expect(screen.getByText("Contrato Empresa")).toBeInTheDocument();
  });

  it("mantém a consulta disponível para quem só pode visualizar", async () => {
    await abrir(false);
    expect(screen.queryByRole("button", { name: "Desarquivar Contrato Empresa" })).not.toBeInTheDocument();
  });

  it.each([
    [{ tipo: "CONTRATO_TAREFA", contratoId: 8 }, "/contratos/8/kanban/tasks/7/arquivamento"],
    [{ tipo: "PIPELINE_TAREFA", negocioId: 9 }, "/pipeline-vendas/tarefas/7/arquivamento"],
    [{ tipo: "NEGOCIO", funilId: 12 }, "/pipeline-vendas/negocios/7/arquivamento"],
    [{ tipo: "CONTRATO" }, "/contratos/7/arquivamento"],
    [{ tipo: "REUNIAO" }, "/reunioes/7/arquivamento"],
  ] as [KanbanArquivoContexto, string][])("arquiva manualmente usando a API correta: %j", async (scope, path) => {
    render(<QueryClientProvider client={client}><KanbanArquivarButton contexto={scope} id={7} titulo="Entrega" /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Arquivar Entrega" }));
    await waitFor(() => expect(mocks.patch).toHaveBeenCalledWith(path, { arquivado: true }));
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Item arquivado"));
  });
});
