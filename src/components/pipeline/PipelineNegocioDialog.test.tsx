import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { PipelineNegocio } from "@/services/usePipelineVendas";
import { PipelineNegocioDialog } from "./PipelineNegocioDialog";

vi.mock("./PipelineDadosAdicionais", () => ({ PipelineDadosAdicionais: () => null }));
vi.mock("./PipelineTarefasPanel", () => ({ PipelineTarefasPanel: () => null }));
vi.mock("./PipelineComentariosPanel", () => ({ PipelineComentariosPanel: () => null }));
vi.mock("./PipelineHistoricoPanel", () => ({ PipelineHistoricoPanel: () => null }));
vi.mock("./PipelinePropostasPanel", () => ({ PipelinePropostasPanel: () => null }));

const scrollIntoView = HTMLElement.prototype.scrollIntoView;
beforeAll(() => { HTMLElement.prototype.scrollIntoView = vi.fn(); });
afterAll(() => { HTMLElement.prototype.scrollIntoView = scrollIntoView; });

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
  it("permite atribuir um lead recebido sem responsável preservando a origem da integração", async () => {
    const salvar = vi.fn();
    render(<PipelineNegocioDialog
      negocio={{ ...negocio, tipoFunil: "PRE_VENDAS", responsavelId: 0, responsavelNome: "Sem responsável", origemNegocio: "Integração" }}
      preVendas initialResponsavelId={7} etapas={[]} empresas={[]}
      usuarios={[{ id: 7, nomeCompleto: "Ana Souza", situacao: "ATIVO", email: "ana@example.com", cargo: "Comercial", aceitouTermos: true, dataCriacao: "", dataAtualizacao: "" }]} motivosPerda={[]}
      canEdit canConclude={false} canConvert={false} canViewTasks={false} canCreateTask={false} canEditTask={false}
      canConcludeTask={false} canViewComments={false} canCreateComment={false} canViewHistory={false} canCreateProposal={false}
      isProcessing={false} onClose={vi.fn()} onSave={salvar} onConclude={vi.fn()} onReactivate={vi.fn()}
      onConvert={vi.fn()} onOpenContract={vi.fn()} onCreateProposal={vi.fn()}
    />);
    fireEvent.click(screen.getByRole("button", { name: "Dados" }));
    const responsavel = screen.getByRole("combobox", { name: "Responsável" });
    expect(responsavel).toHaveTextContent("Sem responsável");
    expect(responsavel).not.toHaveAttribute("aria-required");
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(salvar).toHaveBeenLastCalledWith(expect.objectContaining({ responsavelId: 0, origemNegocio: "Integração" }));
    fireEvent.keyDown(responsavel, { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name: /Ana Souza/ }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(salvar).toHaveBeenLastCalledWith(expect.objectContaining({ responsavelId: 7, origemNegocio: "Integração" }));
  });
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
