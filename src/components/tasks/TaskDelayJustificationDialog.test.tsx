import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskDelayJustificationDialog } from "./TaskDelayJustificationDialog";
import { taskIsOverdue } from "./taskDeadline";

describe("justificativa da conclusão atrasada", () => {
  it("exige justificativa, destaca o campo e remove destaque ao preencher", async () => {
    const confirm = vi.fn().mockResolvedValue(undefined), close = vi.fn();
    render(<TaskDelayJustificationDialog title="Revisar documentos" onConfirm={confirm} onClose={close} />);
    fireEvent.click(screen.getByRole("button", { name: "Justificar e concluir" }));
    const field = screen.getByLabelText(/Justificativa do atraso/);
    expect(field).toHaveAttribute("data-field-error", "true"); expect(confirm).not.toHaveBeenCalled();
    fireEvent.change(field, { target: { value: "  Cliente enviou os documentos depois do prazo.  " } });
    expect(field).not.toHaveAttribute("data-field-error");
    fireEvent.click(screen.getByRole("button", { name: "Justificar e concluir" }));
    await waitFor(() => expect(confirm).toHaveBeenCalledWith("Cliente enviou os documentos depois do prazo."));
    expect(close).toHaveBeenCalledOnce();
  });
  it("permite cancelar sem concluir e mantém a janela aberta quando falha", async () => {
    const confirm = vi.fn().mockRejectedValue(new Error("Você perdeu acesso a esta tarefa.")), close = vi.fn();
    render(<TaskDelayJustificationDialog title="Revisão" onConfirm={confirm} onClose={close} />);
    fireEvent.change(screen.getByLabelText(/Justificativa do atraso/), { target: { value: "Aguardando cliente." } });
    fireEvent.click(screen.getByRole("button", { name: "Justificar e concluir" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Você perdeu acesso a esta tarefa."));
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" })); expect(close).toHaveBeenCalledOnce();
  });
  it("considera o dia inteiro no fuso de São Paulo", () => {
    expect(taskIsOverdue("2026-11-10", new Date("2026-11-11T00:05:00Z"))).toBe(false);
    expect(taskIsOverdue("2026-11-10", new Date("2026-11-11T03:05:00Z"))).toBe(true);
    expect(taskIsOverdue(null)).toBe(false);
  });
});
