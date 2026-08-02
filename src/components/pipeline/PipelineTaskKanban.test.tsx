import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PipelineTarefa } from "@/services/usePipelineAtividades";
import { PipelineTaskKanban } from "./PipelineTaskKanban";

const createTask = (
  id: number,
  titulo: string,
  status: PipelineTarefa["status"],
): PipelineTarefa => ({
  id,
  negocioId: 10,
  negocioNome: "Jota",
  titulo,
  responsavelId: 1,
  responsavelNome: "Gustavo Trindade",
  prazo: "2026-08-05",
  prioridade: "MEDIA",
  status,
  tipo: "Follow-up",
  subtarefas: [],
  criadoEm: "2026-08-02T10:00:00",
  atualizadoEm: "2026-08-02T10:00:00",
});

describe("PipelineTaskKanban", () => {
  it("organiza as tarefas por status e permite movê-las entre as colunas", () => {
    const pendingTask = createTask(1, "Enviar proposta", "PENDENTE");
    const inProgressTask = createTask(2, "Ligar para o cliente", "EM_ANDAMENTO");
    const onMove = vi.fn();
    const dataTransfer = {
      effectAllowed: "move",
      dropEffect: "move",
      setData: vi.fn(),
      getData: vi.fn(() => "1"),
    } as unknown as DataTransfer;

    render(
      <PipelineTaskKanban
        tasks={[pendingTask, inProgressTask]}
        canEdit
        canMove
        onEdit={vi.fn()}
        onMove={onMove}
      />,
    );

    expect(screen.getByRole("region", { name: "Pendente" })).toHaveTextContent("Enviar proposta");
    expect(screen.getByRole("region", { name: "Em andamento" })).toHaveTextContent("Ligar para o cliente");
    expect(screen.getByRole("region", { name: "Concluída" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Cancelada" })).toBeInTheDocument();

    fireEvent.dragStart(screen.getByTestId("pipeline-task-1"), { dataTransfer });
    fireEvent.dragOver(screen.getByRole("region", { name: "Em andamento" }), { dataTransfer });
    fireEvent.drop(screen.getByRole("region", { name: "Em andamento" }), { dataTransfer });

    expect(onMove).toHaveBeenCalledWith(pendingTask, "EM_ANDAMENTO");
  });
});
