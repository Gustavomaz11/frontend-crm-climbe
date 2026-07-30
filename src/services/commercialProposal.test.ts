import { describe, expect, it } from "vitest";
import { isRecurringService, SERVICE_OPTIONS } from "./commercialProposal";

describe("catálogo comercial", () => {
  it("expõe todos os serviços aceitos no envio da proposta", () => {
    expect(SERVICE_OPTIONS.map((item) => item.label)).toEqual([
      "BPO", "CFO", "Contabilidade", "Valuation", "Finance Support", "Consórcio", "Desenvolvimento de Software",
    ]);
  });

  it("identifica apenas serviços mensais como recorrentes", () => {
    expect(isRecurringService("BPO")).toBe(true);
    expect(isRecurringService("FINANCE_SUPPORT")).toBe(true);
    expect(isRecurringService("VALUATION")).toBe(false);
    expect(isRecurringService("CONSORCIO")).toBe(false);
  });
});
