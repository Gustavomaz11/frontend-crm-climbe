import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AprovarAcesso from "./AprovarAcesso";
import type { SolicitacaoAcesso } from "@/services/useUsuarios";

const mocks = vi.hoisted(() => ({
  get: vi.fn(), delete: vi.fn(), toast: vi.fn(),
}));

vi.mock("@/api", () => ({ api: { get: mocks.get, delete: mocks.delete } }));
vi.mock("@/hooks/use-toast", () => ({ toast: mocks.toast }));
vi.mock("@/components/layout/AppHeaderUser", () => ({ AppHeaderUser: () => null }));
vi.mock("@/components/layout/AppSidebarNav", () => ({ AppSidebarNav: () => null }));
vi.mock("@/components/access/GerenciamentoAcessos", () => ({ GerenciamentoAcessos: () => null }));
vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({
    basicUserData: { id: 3, nomeCompleto: "Administrador" },
    userData: null,
  }),
}));
vi.mock("@/services/usePermissoes", () => ({
  usePermissoes: () => ({ data: [] }),
  useGruposPermissoes: () => ({ data: [] }),
}));
vi.mock("@/services/useUsuarios", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services/useUsuarios")>(),
  useCargos: () => ({ data: [] }),
  useUsuarioById: () => ({ data: { cargo: "Administrador" } }),
  useAprovarSolicitacaoAcesso: () => ({ isPending: false }),
  useRecusarSolicitacaoAcesso: () => ({ isPending: false }),
}));

const pedidos: SolicitacaoAcesso[] = [
  { id: 7, origem: "USUARIO", nomeCompleto: "Ana Manual", email: "ana@example.com", status: "PENDENTE" },
  { id: 7, origem: "GOOGLE", nomeCompleto: "Bruno Google", email: "bruno@example.com", status: "APROVADO" },
  { id: 8, origem: "USUARIO", nomeCompleto: "Carla Recusada", email: "carla@example.com", status: "RECUSADO" },
];

let queryClient: QueryClient;
let dados: SolicitacaoAcesso[];

beforeEach(() => {
  vi.clearAllMocks();
  dados = [...pedidos];
  mocks.get.mockImplementation(async () => ({ data: dados }));
  mocks.delete.mockImplementation(async (url: string) => {
    dados = dados.filter((item) => url !== `/usuarios/solicitacoes/${item.origem}/${item.id}`);
    return { data: { success: true } };
  });
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
});

afterEach(() => {
  cleanup();
  queryClient.clear();
});

async function abrirPagina() {
  render(<QueryClientProvider client={queryClient}><MemoryRouter><AprovarAcesso /></MemoryRouter></QueryClientProvider>);
  await screen.findByRole("button", { name: "Excluir solicitação de Ana Manual" });
}

describe("exclusão de solicitações de acesso", () => {
  it.each(pedidos)("exclui $status da origem $origem e mantém as outras solicitações", async (pedido) => {
    await abrirPagina();
    fireEvent.click(screen.getByRole("button", { name: `Excluir solicitação de ${pedido.nomeCompleto}` }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(pedido.email);
    expect(dialog).toHaveTextContent(pedido.status === "PENDENTE"
      ? "o pedido de acesso será cancelado"
      : "A conta e o acesso do usuário serão mantidos");
    expect(mocks.delete).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir solicitação" }));
    await waitFor(() => expect(mocks.delete).toHaveBeenCalledWith(`/usuarios/solicitacoes/${pedido.origem}/${pedido.id}`));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByRole("button", { name: `Excluir solicitação de ${pedido.nomeCompleto}` })).not.toBeInTheDocument());
    expect(queryClient.getQueryData(["usuarios", "solicitacoes"])).toEqual(pedidos.filter((item) => item !== pedido));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Solicitação excluída" }));
  });

  it("permite cancelar a confirmação sem excluir nada", async () => {
    await abrirPagina();
    fireEvent.click(screen.getByRole("button", { name: "Excluir solicitação de Ana Manual" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(mocks.delete).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["usuarios", "solicitacoes"])).toHaveLength(3);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("mantém o pedido e a confirmação quando a API falha", async () => {
    mocks.delete.mockRejectedValue({ response: { data: { message: "Este pedido já foi atualizado." } } });
    await abrirPagina();
    fireEvent.click(screen.getByRole("button", { name: "Excluir solicitação de Ana Manual" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir solicitação" }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      description: "Este pedido já foi atualizado.", variant: "destructive",
    })));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(queryClient.getQueryData(["usuarios", "solicitacoes"])).toHaveLength(3);
    expect(within(dialog).getByRole("button", { name: "Excluir solicitação" })).toBeEnabled();
  });

  it("bloqueia confirmações repetidas durante o envio", async () => {
    let concluir!: (result: unknown) => void;
    mocks.delete.mockReturnValue(new Promise((resolve) => { concluir = resolve; }));
    await abrirPagina();
    fireEvent.click(screen.getByRole("button", { name: "Excluir solicitação de Ana Manual" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir solicitação" }));
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Excluindo..." })).toBeDisabled());
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(mocks.delete).toHaveBeenCalledTimes(1);
    dados = dados.filter((item) => item.origem !== "USUARIO" || item.id !== 7);
    concluir({ data: { success: true } });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });
});
