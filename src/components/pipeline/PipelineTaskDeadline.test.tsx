import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PipelineTarefasPanel } from "./PipelineTarefasPanel";
import { PipelineTarefasVisao } from "./PipelineTarefasVisao";
import { PipelineTarefaDialog } from "./PipelineTarefaDialog";
import type { PipelineTarefa } from "@/services/usePipelineAtividades";

const mocks = vi.hoisted(() => ({ tasks: [] as unknown[], status: vi.fn() }));
vi.mock("@/services/usePipelineAtividades", async original => ({ ...await original<typeof import("@/services/usePipelineAtividades")>(),
  useNegocioTarefas: () => ({ data: mocks.tasks }), usePipelineTarefas: () => ({ data: mocks.tasks }),
  useCreatePipelineTarefa: () => ({ isPending: false }), useUpdatePipelineTarefa: () => ({ isPending: false }),
  useSetPipelineTarefaStatus: () => ({ mutateAsync: mocks.status, isPending: false }),
}));
vi.mock("@/components/tasks/TaskCollaborationPanel", () => ({ TaskCollaborationPanel: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const task: PipelineTarefa = { id: 1, negocioId: 10, negocioNome: "Empresa", titulo: "Enviar documentação", responsavelId: 1, responsavelNome: "Ana", prazo: "2020-01-01", prioridade: "MEDIA", status: "PENDENTE", tipo: "Documentação", subtarefas: [], criadoEm: "2020-01-01", atualizadoEm: "2020-01-01" };
beforeEach(() => { vi.clearAllMocks(); mocks.tasks = [task]; mocks.status.mockResolvedValue({}); });

describe("conclusão atrasada nas atividades comerciais", () => {
  it.each(["negociação", "agenda"])("solicita justificativa antes da conclusão na %s", async origem => {
    if (origem === "negociação") render(<PipelineTarefasPanel negocioId={10} responsavelId={1} usuarios={[]} canView canCreate canEdit canConclude />);
    else render(<PipelineTarefasVisao negocios={[]} usuarios={[]} canView canViewAll canConclude onOpenNegocio={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Concluir tarefa" }));
    expect(mocks.status).not.toHaveBeenCalled(); expect(screen.getByRole("dialog")).toHaveTextContent("Justificar atraso");
    fireEvent.change(screen.getByLabelText(/Justificativa do atraso/), { target: { value: "Aguardando documentos." } });
    fireEvent.click(screen.getByRole("button", { name: "Justificar e concluir" }));
    await waitFor(() => expect(mocks.status).toHaveBeenCalledWith({ tarefaId: 1, status: "CONCLUIDA", justificativaAtraso: "Aguardando documentos." }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("o formulário exige justificativa ao mudar o status para concluída", () => {
    const save = vi.fn();
    render(<PipelineTarefaDialog tarefa={task} usuarios={[]} defaultResponsavelId={1} isProcessing={false} onClose={vi.fn()} onSave={save} />);
    fireEvent.change(screen.getByLabelText(/Status/), { target: { value: "CONCLUIDA" } });
    expect(screen.getByLabelText(/Justificativa do atraso/)).toBeRequired();
    fireEvent.click(screen.getByRole("button", { name: "Salvar tarefa" }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Justificativa do atraso/)).toHaveAttribute("data-field-error", "true");
  });
});
