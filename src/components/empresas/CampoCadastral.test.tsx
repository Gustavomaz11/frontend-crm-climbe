import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CampoCadastral } from "./CampoCadastral";

afterEach(cleanup);

describe("datas cadastrais da empresa", () => {
  it("formata as datas e atualizações em todas as seções e coleções", () => {
    const { container } = render(<CampoCadastral name="company" value={{
      founded: "2020-01-02", statusDate: "2026-10-01", specialDate: "2026-02-03",
      updated: "2026-10-16T14:30:00Z", simples: { since: "2024-01-01" }, simei: { since: "2024-01-02" },
      members: [{ since: "2024-01-03" }], registrations: [{ statusDate: "2024-01-04" }],
      suframa: { approvalDate: "2024-01-05", incentives: [{ start: "2024-01-06", end: "2024-01-07", expiration: "2024-01-08", date: "2024-01-09" }] },
    }} />);
    for (const date of ["02/01/2020", "01/10/2026", "03/02/2026", "16/10/2026, 11:30", ...Array.from({ length: 9 }, (_, i) => `0${i + 1}/01/2024`)]) {
      expect(screen.getByText(date)).toBeInTheDocument();
    }
    expect(container.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("normaliza os campos de data sem modificar o valor original até uma edição", () => {
    const onChange = vi.fn();
    render(<><CampoCadastral name="expiration" value="2026-10-31" onChange={onChange} /><CampoCadastral name="updated" value="2026-10-16T14:30:15Z" onChange={onChange} /></>);
    const date = screen.getByLabelText("Validade");
    const updated = screen.getByLabelText("Última atualização");
    expect(date).toHaveAttribute("type", "date");
    expect(date).toHaveAttribute("lang", "pt-BR");
    expect(date).toHaveValue("2026-10-31");
    expect(updated).toHaveAttribute("type", "datetime-local");
    expect((updated as HTMLInputElement).value).toMatch(/^2026-10-16T11:30:15(?:\.000)?$/);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(date, { target: { value: "2026-11-01" } });
    expect(onChange).toHaveBeenLastCalledWith("2026-11-01");
    fireEvent.change(updated, { target: { value: "2026-10-17T12:45" } });
    expect(onChange).toHaveBeenLastCalledWith("2026-10-17T12:45");
    fireEvent.change(date, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith("");
  });
});
