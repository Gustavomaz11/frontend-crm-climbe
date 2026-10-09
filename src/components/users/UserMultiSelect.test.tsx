import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserMultiSelect } from "./UserMultiSelect";
import { FormValidation } from "@/components/ui/form-validation";

describe("responsáveis da tarefa", () => {
  it("seleciona duas pessoas, mantém a seleção na busca e exige pelo menos uma", () => {
    const save = vi.fn();
    const Harness = () => {
      const [value, setValue] = useState<number[]>([]);
      return <FormValidation><UserMultiSelect required users={[{ id: 1, nomeCompleto: "Ana" }, { id: 2, nomeCompleto: "Bia" }]} value={value} onChange={setValue} /><button type="button" data-validate-submit onClick={() => save(value)}>Salvar</button></FormValidation>;
    };
    render(<Harness />);
    fireEvent.click(screen.getByText("Salvar")); expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole("group", { name: "Responsáveis" })).toHaveAttribute("data-field-error", "true");
    fireEvent.click(screen.getByRole("checkbox", { name: "Atribuir Ana" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Atribuir Bia" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar responsáveis"), { target: { value: "Bia" } });
    expect(screen.getByRole("checkbox", { name: "Atribuir Bia" })).toBeChecked();
    fireEvent.click(screen.getByText("Salvar")); expect(save).toHaveBeenCalledWith([1, 2]);
  });
});
