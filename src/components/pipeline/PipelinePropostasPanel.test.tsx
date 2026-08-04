import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PipelineNegocio } from "@/services/usePipelineVendas";
import { PipelinePropostasPanel } from "./PipelinePropostasPanel";

const usePropostasMock = vi.fn();

vi.mock("@/services/usePropostas", () => ({
  usePropostas: (...args: unknown[]) => usePropostasMock(...args),
  getPropostaDownloadUrl: vi.fn(),
  getPropostaFileNameFromUrl: (url: string) => url.split("/").pop(),
}));

const negocio: PipelineNegocio = {
  id: 30,
  funilId: 1,
  funilNome: "Comercial",
  empresaId: 10,
  nomeEmpresa: "Apex",
  nomeContato: "Maria",
  telefone: "11999999999",
  email: "maria@apex.com",
  responsavelId: 1,
  responsavelNome: "Gestor",
  etapaId: 4,
  etapaCodigo: "PROPOSTA_EM_ELABORACAO",
  etapaNome: "Proposta em elaboração",
  origemNegocio: "Indicação",
  estrategiaComercial: "Ativa",
  servicoInteresse: "",
  servicosInteresse: [],
  resultado: "ABERTO",
  possuiProposta: true,
  propostaAjustesPendentes: true,
  criadoEm: "2026-08-03T10:00:00",
  ultimaMovimentacaoEm: "2026-08-03T10:00:00",
};

describe("PipelinePropostasPanel", () => {
  beforeEach(() => {
    usePropostasMock.mockReturnValue({
      data: [
        { idProposta: 1, empresaId: 10, negocioId: 30, usuarioId: 1, url: "propostas/atual.pdf", valuation: 1000, status: "PENDENTE", revisaoStatus: "AJUSTES_SOLICITADOS", dataCriacao: "2026-08-03", servico: "BPO" },
        { idProposta: 2, empresaId: 10, negocioId: 20, usuarioId: 1, url: "propostas/anterior.pdf", valuation: 800, status: "APROVADA", revisaoStatus: "APROVADO", dataCriacao: "2026-07-01", servico: "CFO" },
      ],
      isLoading: false,
      error: null,
    });
  });

  it("lista todas as propostas do cliente e destaca a proposta do negócio", () => {
    const onCreate = vi.fn();
    render(<PipelinePropostasPanel negocio={negocio} canCreate onCreate={onCreate} />);

    expect(usePropostasMock).toHaveBeenCalledWith({ empresaId: 10 }, true);
    expect(screen.getByText("atual.pdf")).toBeInTheDocument();
    expect(screen.getByText("anterior.pdf")).toBeInTheDocument();
    expect(screen.getByText("Deste negócio")).toBeInTheDocument();
    expect(screen.getByText("O cliente analisou a proposta e solicitou ajustes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ver ajustes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ver revisão/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Nova proposta/i }));
    expect(onCreate).toHaveBeenCalledOnce();
  });
});
