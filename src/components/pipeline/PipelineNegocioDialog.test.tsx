import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PipelineNegocio } from "@/services/usePipelineVendas";
import { PipelineNegocioDialog } from "./PipelineNegocioDialog";

vi.mock("./PipelineTarefasPanel", () => ({ PipelineTarefasPanel: () => null }));
vi.mock("./PipelineComentariosPanel", () => ({ PipelineComentariosPanel: () => null }));
vi.mock("./PipelineHistoricoPanel", () => ({ PipelineHistoricoPanel: () => null }));
vi.mock("./PipelinePropostasPanel", () => ({ PipelinePropostasPanel: () => null }));

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
  etapaId: 5,
  etapaCodigo: "PROPOSTA_APRESENTADA",
  etapaNome: "Proposta apresentada",
  origemNegocio: "Indicação",
  estrategiaComercial: "Ativa",
  servicoInteresse: "BPO",
  servicosInteresse: ["BPO"],
  resultado: "ABERTO",
  possuiProposta: true,
  propostaAjustesPendentes: true,
  criadoEm: "2026-08-03T10:00:00",
  ultimaMovimentacaoEm: "2026-08-03T10:00:00",
};

describe("PipelineNegocioDialog", () => {
  it("destaca a aba Proposta quando o cliente solicita ajustes", () => {
    render(
      <PipelineNegocioDialog
        negocio={negocio}
        etapas={[]}
        empresas={[]}
        usuarios={[]}
        motivosPerda={[]}
        canEdit={false}
        canConclude={false}
        canConvert={false}
        canViewTasks={false}
        canCreateTask={false}
        canEditTask={false}
        canConcludeTask={false}
        canViewComments={false}
        canCreateComment={false}
        canViewHistory={false}
        canCreateProposal={false}
        isProcessing={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onConclude={vi.fn()}
        onReactivate={vi.fn()}
        onConvert={vi.fn()}
        onOpenContract={vi.fn()}
        onCreateProposal={vi.fn()}
      />,
    );

    const proposalTab = screen.getByRole("button", { name: /Proposta/i });
    expect(proposalTab).toBeEnabled();
    expect(proposalTab).toHaveAttribute("title", "O cliente solicitou ajustes nesta proposta");
    expect(proposalTab).toHaveClass("border-amber-500/35");
    expect(screen.getByLabelText("Ajustes solicitados")).toBeInTheDocument();
  });
});
