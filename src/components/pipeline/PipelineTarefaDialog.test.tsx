import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PipelineTarefaDialog } from "./PipelineTarefaDialog";

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
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/prazo/i), { target: { value: "2026-08-10" } });
    expect(screen.getByLabelText(/data de início/i)).toHaveValue("");
    expect(saveButton).toBeEnabled();
  });
});
