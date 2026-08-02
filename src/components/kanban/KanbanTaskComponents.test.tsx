import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { KanbanTaskDialog, type KanbanTaskDraft } from "./KanbanTaskDialog";
import { KanbanTaskEditDialog } from "./KanbanTaskEditDialog";
import type { ContratoKanbanTask } from "@/services";

describe("componentes de tarefa do Kanban", () => {
  it("permite preencher descrição, prioridade e usuário existente", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const draft: KanbanTaskDraft = {
      titulo: "Nova análise",
      descricao: "Validar os documentos",
      prioridade: "MEDIA",
      responsavelId: "",
      dataInicio: "",
      dataFim: "",
    };

    render(
      <KanbanTaskDialog
        raiaTitulo="A fazer"
        draft={draft}
        usuarios={[{ id: 7, nomeCompleto: "Ana Souza", email: "ana@climbe.com", cargo: "Analista Sênior" }]}
        isSaving={false}
        onChange={onChange}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByDisplayValue("Validar os documentos")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Responsável" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Prioridade"), { target: { value: "ALTA" } });
    expect(onChange).toHaveBeenCalledWith({ ...draft, prioridade: "ALTA" });

    fireEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("exibe prioridade e permite ao responsável concluir uma subtarefa", () => {
    const onToggleSubtask = vi.fn();
    const task: ContratoKanbanTask = {
      id: 30,
      raiaId: 20,
      titulo: "Analisar documentos",
      descricao: "Conferir os anexos enviados",
      prioridade: "ALTA",
      responsavel: { id: 7, nomeCompleto: "Ana Souza" },
      posicao: 0,
      subtarefas: [
        { id: 40, titulo: "Validar balanço", concluida: false, posicao: 0 },
      ],
    };

    render(
      <KanbanTaskCard
        task={task}
        gestor={false}
        usuarioId={7}
        isDragging={false}
        movePending={false}
        subtaskPending={false}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleSubtask={onToggleSubtask}
      />,
    );

    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("Conferir os anexos enviados")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Validar balanço" }));
    expect(onToggleSubtask).toHaveBeenCalledWith(30, task.subtarefas[0]);
  });

  it("abre a edição da tarefa em um modal", async () => {
    const onEdit = vi.fn();
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue(true);
    const task: ContratoKanbanTask = {
      id: 30,
      raiaId: 20,
      titulo: "Analisar documentos",
      descricao: "Conferir os anexos enviados",
      prioridade: "ALTA",
      responsavel: { id: 7, nomeCompleto: "Ana Souza" },
      dataInicio: "2026-07-28",
      dataFim: "2026-08-28",
      posicao: 0,
      subtarefas: [],
    };

    const { rerender } = render(
      <KanbanTaskCard
        task={task}
        gestor
        usuarioId={7}
        isDragging={false}
        movePending={false}
        subtaskPending={false}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onToggleSubtask={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar tarefa Analisar documentos" }));
    expect(onEdit).toHaveBeenCalledWith(task);

    rerender(
      <KanbanTaskEditDialog
        task={task}
        usuarios={[{ id: 7, nomeCompleto: "Ana Souza" }]}
        isSaving={false}
        subtaskPending={false}
        onClose={onClose}
        onSave={onSave}
        onCreateSubtask={vi.fn().mockResolvedValue(true)}
        onUpdateSubtask={vi.fn().mockResolvedValue(true)}
        onToggleSubtask={vi.fn()}
        onDeleteSubtask={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Editar tarefa" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Conferir os anexos enviados")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledOnce();
  });
});
