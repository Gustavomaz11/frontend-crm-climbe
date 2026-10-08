import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Propostas from "./Propostas";

const create = vi.fn();
vi.mock("@/services", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services")>(),
  useEmpresas: () => ({ data: [{ id: 1, nome: "Climbe" }] }),
  useUsuarios: () => ({ data: [] }),
  usePropostas: () => ({ data: [], isLoading: false }),
  useCreatePropostaWithFile: () => ({ mutateAsync: create }),
  useUpdatePropostaStatus: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/components/layout/AppSidebarNav", () => ({ AppSidebarNav: () => null }));

describe("envio de proposta", () => {
  beforeEach(() => {
    create.mockReset().mockResolvedValue({});
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });
  afterEach(() => { vi.restoreAllMocks(); });

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
});
