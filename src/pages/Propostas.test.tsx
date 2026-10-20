vi.mock("@/hooks/useCrudPermissions", () => ({ useCrudPermissions: () => ({ canRead: true, canCreate: canWrite, canEdit: canWrite, canDelete: true, canAccess: true, isLoading: false }) }));
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Propostas from "./Propostas";

let canWrite = true;
let proposalRows: import("@/services/usePropostas").PropostaApi[] = [];
const create = vi.fn();
const Location = () => { const location = useLocation(); return <output aria-label="Rota atual">{location.pathname}{location.search}</output>; };
vi.mock("@/services", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services")>(),
  useEmpresas: () => ({ data: [{ id: 1, nome: "Climbe" }] }),
  useUsuarios: () => ({ data: [] }),
  usePropostas: () => ({ data: proposalRows, isLoading: false }),
  useCreatePropostaWithFile: () => ({ mutateAsync: create }),
  useUpdatePropostaStatus: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/components/layout/AppSidebarNav", () => ({ AppSidebarNav: () => null }));

describe("envio de proposta", () => {
  beforeEach(() => {
    canWrite = true;
    proposalRows = [];
    create.mockReset().mockResolvedValue({});
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("quem s? pode ler consulta propostas sem criar, aprovar ou rejeitar", () => {
    canWrite = false;
    proposalRows = [{ idProposta: 10, empresaId: 1, usuarioId: 7, url: "arquivo.pdf", valuation: 1000, status: "PENDENTE" }];
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={["/propostas?nova=true&empresaId=1"]}><Propostas /></MemoryRouter></QueryClientProvider>);
    expect(screen.getByText("arquivo.pdf")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nova Proposta/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle("Aprovar proposta")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Rejeitar proposta")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar" })).not.toBeInTheDocument();
  });

  it("mostra o anexo antes dos campos e envia o plano completo com o mês convertido", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(<QueryClientProvider client={client}><MemoryRouter><Propostas /></MemoryRouter></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Nova Proposta/i }));
    const file = new File(["proposta"], "proposta.pdf", { type: "application/pdf" });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    const attachment = screen.getByText("proposta.pdf");
    const total = screen.getByRole("textbox", { name: "Valor total da proposta" });
    expect(attachment.compareDocumentPosition(total) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue("Selecione a empresa"), { target: { value: "1" } });
    fireEvent.change(total, { target: { value: "5000000" } });
    fireEvent.change(screen.getByLabelText("Mês de início *"), { target: { value: "2026-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(create).toHaveBeenCalledOnce());
    const payload = create.mock.calls[0][0];
    expect(payload).toMatchObject({ file, empresaId: 1, valuation: 50000,
      configuracao: { mesInicio: "2026-10-01", quantidadeParcelas: 12, servicos: [{ servico: "BPO", valor: 50000 }] } });
    expect(payload.configuracao.recebimentos).toHaveLength(12);
    expect(payload.configuracao.recebimentos.reduce((sum: number, item: { valor: number }) => sum + Math.round(item.valor * 100), 0)).toBe(5000000);
  });

  it("abre a proposta indicada pela notificação e consome o parâmetro", async () => {
    proposalRows = [{ idProposta: 10, empresaId: 1, usuarioId: 7, url: "aceita.pdf", valuation: 1000, status: "APROVADA" }];
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={["/propostas?proposta=10"]}><Propostas /><Location /></MemoryRouter>
    </QueryClientProvider>);
    await waitFor(() => expect(screen.getByRole("heading", { name: "aceita.pdf" })).toBeInTheDocument());
    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/propostas");
    expect(screen.getByLabelText("Rota atual")).not.toHaveTextContent("?proposta=");
  });
});
