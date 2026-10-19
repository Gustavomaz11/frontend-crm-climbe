import { cleanup, render, screen, within } from "@testing-library/react";
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
