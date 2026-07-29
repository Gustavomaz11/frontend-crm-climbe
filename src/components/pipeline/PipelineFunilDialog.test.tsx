import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PipelineFunilDialog } from "./PipelineFunilDialog";

describe("PipelineFunilDialog", () => {
  it("monta um funil completo sem depender de código-fonte", () => {
    const onSave = vi.fn();
    render(<PipelineFunilDialog isProcessing={false} onClose={vi.fn()} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Nome do funil *"), { target: { value: "Consultoria patrimonial" } });
    fireEvent.change(screen.getByLabelText("Estratégia relacionada *"), { target: { value: "Venda consultiva" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Nome do contato" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Salvar funil" }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0][0]).toMatchObject({
      nome: "Consultoria patrimonial",
      estrategia: "Venda consultiva",
      ativo: true,
    });
    expect(onSave.mock.calls[0][0].etapas).toHaveLength(3);
    expect(onSave.mock.calls[0][0].etapas[0].camposObrigatorios).toContain("nomeContato");
    expect(onSave.mock.calls[0][0].etapas[1].sucesso).toBe(true);
    expect(onSave.mock.calls[0][0].etapas[2].perda).toBe(true);
  });
});
