import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ParticipantesReuniaoSelect } from "./ParticipantesReuniaoSelect";

vi.mock("@/services/useUsuarios", () => ({ useUsuarios: () => ({ data: [
  { id: 1, nomeCompleto: "Ana" }, { id: 2, nomeCompleto: "Bruno" }, { id: 3, nomeCompleto: "Clara" },
] }) }));
afterEach(cleanup);

it("mostra a disponibilidade individual dos envolvidos sem afirmar que uma agenda desconhecida está livre", () => {
  render(<ParticipantesReuniaoSelect value={[]} onChange={vi.fn()} periodoValido disponibilidade={[{ id: 1, disponivel: true }, { id: 2, disponivel: false }, { id: 3, disponivel: null }]} />);
  for (const [nome, status] of [["Ana", "Disponível"], ["Bruno", "Ocupado"], ["Clara", "Não verificada"]]) {
    expect(within(screen.getByText(nome).closest("label")!).getByText(status)).toBeInTheDocument();
  }
});

it("permite convidar um usuário ocupado", () => {
  const onChange = vi.fn();
  render(<ParticipantesReuniaoSelect value={[]} onChange={onChange} periodoValido disponibilidade={[{ id: 2, disponivel: false }]} />);
  const pessoa = within(screen.getByText("Bruno").closest("label")!);
  expect(pessoa.getByText("Ocupado")).toBeInTheDocument();
  expect(pessoa.getByRole("checkbox")).toBeEnabled();
  fireEvent.click(pessoa.getByRole("checkbox"));
  expect(onChange).toHaveBeenCalledWith([2]);
});
