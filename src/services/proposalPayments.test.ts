import { describe, expect, it } from "vitest";
import { calculateProposalReceipts, getServiceAllocationError, getProposalServicesLabel } from "./proposalPayments";

const sumCents = (items: { valor: number }[]) => items.reduce((sum, item) => sum + Math.round(item.valor * 100), 0);

describe("recebimentos da proposta", () => {
  it("mantém 50 mil com os dois primeiros recebimentos de 3 mil e os demais de 4.400", () => {
    const plan = calculateProposalReceipts(50000, 12, [{ numero: 1, valor: 3000 }, { numero: 2, valor: 3000 }]);
    expect(plan.error).toBeNull();
    expect(plan.recebimentos.map((item) => item.valor)).toEqual([3000, 3000, ...Array(10).fill(4400)]);
    expect(sumCents(plan.recebimentos)).toBe(5000000);
  });

  it("distribui os centavos sem alterar o total quando apenas o primeiro recebimento é personalizado", () => {
    const plan = calculateProposalReceipts(50000, 12, [{ numero: 1, valor: 3000 }]);
    expect(plan.error).toBeNull();
    expect(plan.recebimentos[0].valor).toBe(3000);
    expect(sumCents(plan.recebimentos)).toBe(5000000);
    expect(new Set(plan.recebimentos.slice(1).map((item) => item.valor))).toEqual(new Set([4272.72, 4272.73]));
  });

  it("preserva os centavos em todas as quantidades de 1 a 24", () => {
    for (let count = 1; count <= 24; count++) {
      const plan = calculateProposalReceipts(50000, count);
      expect(plan.error).toBeNull();
      expect(sumCents(plan.recebimentos)).toBe(5000000);
    }
  });

  it("recusa valores que consomem o saldo ou uma personalização completa com soma incorreta", () => {
    expect(calculateProposalReceipts(50000, 12, [{ numero: 1, valor: 50000 }]).error).toBeTruthy();
    expect(calculateProposalReceipts(50000, 1, [{ numero: 1, valor: 3000 }]).error).toBeTruthy();
    expect(calculateProposalReceipts(50000, 12, [{ numero: 1, valor: -1 }]).error).toBeTruthy();
    expect(calculateProposalReceipts(50000, 0).error).toBeTruthy();
  });

  it("exige a distribuição completa entre serviços e apresenta todos os serviços", () => {
    const services = [{ servico: "BPO" as const, valor: 30000 }, { servico: "CFO" as const, valor: 20000 }];
    expect(getServiceAllocationError(services, 50000)).toBeNull();
    expect(getServiceAllocationError(services, 60000)).toContain("Falta distribuir");
    expect(getServiceAllocationError(services, 40000)).toContain("excede");
    expect(getProposalServicesLabel({ servicos: services })).toBe("BPO + CFO");
    expect(getProposalServicesLabel({ servico: "VALUATION" })).toBe("Valuation");
  });
});
