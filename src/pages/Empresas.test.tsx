import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import Empresas from "./Empresas";

vi.mock("@/api", () => ({ api: { get: vi.fn() } }));
vi.mock("@/components/layout/AppSidebar", () => ({ AppSidebar: () => null }));
vi.mock("@/components/layout/AppHeaderUser", () => ({ AppHeaderUser: () => null }));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (state: object) => unknown) => selector({}) }));

const clients: QueryClient[] = [];

afterEach(() => {
  cleanup();
  clients.forEach(client => client.clear());
  clients.length = 0;
  vi.clearAllMocks();
});

describe("detalhes da empresa", () => {
  it.each([
    { caso: "nulos em um cadastro antigo", dadosCadastrais: null },
    { caso: "ausentes", dadosCadastrais: undefined },
    { caso: "preenchidos", dadosCadastrais: { status: { id: 2, text: "Ativa" }, company: { members: [{ person: { name: "Ana" } }] } } },
  ])("abre a empresa com dados cadastrais $caso", async ({ dadosCadastrais }) => {
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === "/empresas") return { data: [{ id: 7, nomeFantasia: "Empresa Exemplo", cnpj: "37335118000180", dadosCadastrais }] };
      if (url === "/empresas/7/financeiro") return { data: { empresaId: 7, servicos: [] } };
      throw new Error(`Requisição inesperada: ${url}`);
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    clients.push(client);
    render(<QueryClientProvider client={client}><MemoryRouter><Empresas /></MemoryRouter></QueryClientProvider>);

    fireEvent.click(await screen.findByText("Empresa Exemplo"));

    expect(screen.getByRole("heading", { name: "Empresa Exemplo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dados cadastrais complementares" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Visualizar comprovantes" })).toBeInTheDocument();
    expect(await screen.findByText("Nenhum serviço contratado.")).toBeInTheDocument();
    if (dadosCadastrais) expect(screen.getByText("Ana")).toBeInTheDocument();
  });
});
