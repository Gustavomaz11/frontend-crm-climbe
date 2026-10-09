import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PipelineTarefaDialog } from "./PipelineTarefaDialog";
vi.mock("@/components/tasks/TaskCollaborationPanel", () => ({ TaskCollaborationPanel: () => null }));

const usuario = {
  id: 7,
  nomeCompleto: "Marcio Souza",
  email: "marcio@climbe.com.br",
  contato: "",
  cpf: "",
  cargo: "Diretor Comercial",
  cargoNome: "Diretor Comercial",
  situacao: "ATIVO",
  aceitouTermos: true,
  dataCriacao: "2026-01-01T00:00:00",
  dataAtualizacao: "2026-01-01T00:00:00",
};

describe("PipelineTarefaDialog", () => {
  it("usa um select real para o tipo da tarefa", () => {
    render(<PipelineTarefaDialog usuarios={[usuario]} defaultResponsavelId={7} isProcessing={false} onClose={vi.fn()} onSave={vi.fn()} />);

    const typeSelect = screen.getByRole("combobox", { name: /tipo/i });
    expect(typeSelect).toHaveValue("Follow-up");
    expect(screen.getByRole("option", { name: "Ligação" })).toBeInTheDocument();
  });

  it("exige prazo mas permite salvar sem data de início", () => {
    const onSave = vi.fn();
    render(<PipelineTarefaDialog usuarios={[usuario]} defaultResponsavelId={7} isProcessing={false} onClose={vi.fn()} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: "Ligar para cliente" } });
    const saveButton = screen.getByRole("button", { name: /salvar tarefa/i });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Prazo");
    expect(screen.getByLabelText(/prazo/i)).toHaveAttribute("data-field-error", "true");

    fireEvent.change(screen.getByLabelText(/prazo/i), { target: { value: "2026-08-10" } });
    expect(screen.getByLabelText(/data de início/i)).toHaveValue("");
    expect(saveButton).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/prazo/i)).not.toHaveAttribute("data-field-error");
    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("envia vários responsáveis e limpa atribuições de subtarefas ao remover uma pessoa", () => {
    const onSave = vi.fn();
    render(<PipelineTarefaDialog tarefa={{ id: 10, negocioId: 1, negocioNome: "Cliente", titulo: "Análise", responsavelId: 7,
      responsavelNome: usuario.nomeCompleto, responsaveis: [{ id: 7, nomeCompleto: usuario.nomeCompleto }, { id: 8, nomeCompleto: "Ana" }],
      prioridade: "MEDIA", status: "PENDENTE", tipo: "Follow-up", prazo: "2026-10-12", criadoEm: "", atualizadoEm: "",
      subtarefas: [{ id: 20, titulo: "Conferir balanço", concluida: false, posicao: 0, responsavel: { id: 8, nomeCompleto: "Ana" } }] }}
      usuarios={[usuario, { ...usuario, id: 8, nomeCompleto: "Ana" }, { ...usuario, id: 9, nomeCompleto: "Bia" }]}
      defaultResponsavelId={7} isProcessing={false} onClose={vi.fn()} onSave={onSave} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Atribuir Ana" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Atribuir Bia" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar tarefa" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ responsavelIds: [7, 9], subtarefas: [expect.objectContaining({ responsavelId: null })] }));
  });
});
