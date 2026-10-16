import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SalaReuniaoSelect } from "./SalaReuniaoSelect";

const mocks = vi.hoisted(() => ({ salas: [] as { email: string; nome: string }[] }));
vi.mock("@/services/useReunioes", () => ({
  getReuniaoError: () => "Falha ao consultar salas",
  useSalasReuniao: () => ({ data: mocks.salas, isLoading: false }),
}));

describe("local da reunião pela sala física", () => {
  beforeEach(() => { mocks.salas = []; });
  afterEach(cleanup);

  it("seleciona a sala física e usa o nome completo como local", () => {
    const nome = "Escritório Climbe Cont - Hermes Fontes-2-Sala de Reunião - Climbe Cont (6)";
    mocks.salas = [{ email: "sala@resource.calendar.google.com", nome }];
    const onChange = vi.fn();
    render(<SalaReuniaoSelect email="" local="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Sala física"), { target: { value: mocks.salas[0].email } });
    expect(onChange).toHaveBeenCalledWith(mocks.salas[0].email, nome);
  });

  it("permite informar outro local se não houver salas acessíveis", () => {
    const onChange = vi.fn();
    render(<SalaReuniaoSelect email="" local="" onChange={onChange} />);
    expect(screen.getByText(/Nenhuma sala física encontrada/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Sala física"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith("", "");
  });
});
