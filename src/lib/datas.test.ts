import { describe, expect, it } from "vitest";
import { dataParaInput, ehDataIso, formatarData } from "./datas";

describe("datas no padrão brasileiro", () => {
  it("preserva datas civis, inclusive no primeiro dia do mês e em ano bissexto", () => {
    expect(formatarData("2026-10-01")).toBe("01/10/2026");
    expect(formatarData("2024-02-29")).toBe("29/02/2024");
    expect(dataParaInput("2026-01-01")).toBe("2026-01-01");
  });

  it("converte timestamps com fuso para São Paulo, incluindo a mudança de dia", () => {
    expect(formatarData("2026-10-16T01:30:00Z")).toBe("15/10/2026, 22:30");
    expect(formatarData("2026-10-16T14:30:00+00:00")).toBe("16/10/2026, 11:30");
    expect(dataParaInput("2026-10-16T01:30:15.123Z")).toBe("2026-10-15T22:30:15");
  });

  it("mantém o horário local dos comprovantes sem informação de fuso", () => {
    expect(formatarData("2026-10-16T00:05:00.123456789")).toBe("16/10/2026, 00:05");
    expect(dataParaInput("2026-10-16T00:05:00")).toBe("2026-10-16T00:05:00");
  });

  it("trata valores ausentes e inválidos sem produzir Invalid Date", () => {
    expect(formatarData(null)).toBe("Não informado");
    expect(formatarData("2026-02-30")).toBe("Data inválida");
    expect(formatarData("2026-13-01T25:00:00Z")).toBe("Data inválida");
    expect(dataParaInput("inválida")).toBe("");
    expect(ehDataIso("37335118000180")).toBe(false);
  });
});
