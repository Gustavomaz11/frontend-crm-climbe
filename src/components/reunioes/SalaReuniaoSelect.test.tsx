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
    render(<SalaReuniaoSelect email="" local="" onChange={onChange} periodoValido disponibilidade={[{ email: mocks.salas[0].email, disponivel: true }]} />);
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

  it("sinaliza e bloqueia salas ocupadas ou não verificadas", () => {
    mocks.salas = [{ email: "ocupada", nome: "Sala ocupada" }, { email: "livre", nome: "Sala livre" }, { email: "desconhecida", nome: "Sala desconhecida" }];
    const onChange = vi.fn();
    render(<SalaReuniaoSelect email="" local="" onChange={onChange} periodoValido disponibilidade={[{ email: "ocupada", disponivel: false }, { email: "livre", disponivel: true }]} />);
    expect(screen.getByRole("option", { name: "Sala ocupada — Ocupada" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Sala livre — Disponível" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "Sala desconhecida — Não verificada" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Sala física"), { target: { value: "ocupada" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("não reaproveita a disponibilidade anterior enquanto consulta outro período", () => {
    mocks.salas = [{ email: "sala", nome: "Sala 1" }];
    render(<SalaReuniaoSelect email="sala" local="Sala 1" onChange={vi.fn()} periodoValido consultando disponibilidade={[{ email: "sala", disponivel: true }]} />);
    expect(screen.getByRole("option", { name: "Sala 1 — Verificando..." })).toBeDisabled();
  });
});
