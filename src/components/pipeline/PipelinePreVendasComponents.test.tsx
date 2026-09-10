import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { PipelineCancelarTarefaDialog } from "./PipelineCancelarTarefaDialog";
import { PipelineCadenciaPorEtapa } from "./PipelineCadenciaPorEtapa";
import { PipelineNegocioCard } from "./PipelineNegocioCard";
import { emptyPipelineNegocioDraft, isPipelineNegocioDraftValid } from "./pipelineNegocioForm";
import type { PipelineNegocio } from "@/services/usePipelineVendas";
import type { PipelineTarefa } from "@/services/usePipelineAtividades";
import type { CadenceStep } from "@/services/usePipelineCampanhas";
import { api } from "@/api";

vi.mock("@/api", () => ({ api: { post: vi.fn().mockResolvedValue({ data: {} }) } }));
const lead = { id: 1, tipoFunil: "PRE_VENDAS", nomeEmpresa: "Empresa", nomeContato: "Maria", resultado: "ABERTO", valorEstimadoProposta: 123456,
  cadenciaStatus: "CONCLUIDA", campanhaOrigemNome: "Recuperação", tags: [{ id: 1, nome: "Prioridade 3", cor: "#334455", ativo: true }] } as PipelineNegocio;

describe("Pré-vendas", () => {
  it("aceita contato sem telefone e e-mail", () => {
    expect(isPipelineNegocioDraftValid({ ...emptyPipelineNegocioDraft, cadastrarEmpresa: false, nomeEmpresa: "Empresa", nomeContato: "Maria", responsavelId: "1", origemNegocio: "Outbound", estrategiaComercial: "Ativa" })).toBe(true);
  });
  it("mostra tags e cadência encerrada sem valor de proposta", () => {
    render(<PipelineNegocioCard negocio={lead} canMove onOpen={vi.fn()} onDragStart={vi.fn()} />);
    expect(screen.getByText("Prioridade 3")).toBeInTheDocument();
    expect(screen.getByText("Cadência encerrada")).toBeInTheDocument();
    expect(screen.queryByText(/123.456/)).not.toBeInTheDocument();
  });
  it("exige motivo e envia cancelamento separado de conclusão", async () => {
    const close = vi.fn();
    render(<QueryClientProvider client={new QueryClient()}><PipelineCancelarTarefaDialog tarefa={{ id: 10, titulo: "Ligação" } as PipelineTarefa} onClose={close} /></QueryClientProvider>);
    expect(screen.getByText("Confirmar cancelamento")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motivo obrigatório"), { target: { value: "SEM_CANAL_CONTATO" } });
    fireEvent.change(screen.getByLabelText("Comentário"), { target: { value: "Telefone ausente" } });
    fireEvent.click(screen.getByText("Confirmar cancelamento"));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(api.post).toHaveBeenCalledWith("/pipeline-vendas/tarefas/10/cancelar", { motivo: "SEM_CANAL_CONTATO", comentario: "Telefone ausente" });
  });
  it("mantém sequências distintas ao trocar de etapa no editor", () => {
    const Editor = () => {
      const [steps, setSteps] = useState<CadenceStep[]>([
        { tipo: "TAREFA", titulo: "Contato recuperação", etapaFunilCodigo: "TENTATIVA_CONTATO" },
        { tipo: "TAREFA", titulo: "Qualificar conectado", etapaFunilCodigo: "LEAD_CONECTADO" },
      ]);
      return <PipelineCadenciaPorEtapa steps={steps} scripts={[]} onChange={setSteps} />;
    };
    render(<Editor />);
    fireEvent.change(screen.getByDisplayValue("Contato recuperação"), { target: { value: "Novo contato" } });
    fireEvent.change(screen.getByLabelText("Etapa de pré-vendas"), { target: { value: "LEAD_CONECTADO" } });
    expect(screen.getByDisplayValue("Qualificar conectado")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Etapa de pré-vendas"), { target: { value: "TENTATIVA_CONTATO" } });
    expect(screen.getByDisplayValue("Novo contato")).toBeInTheDocument();
  });
});
