import { describe, expect, it } from "vitest";
import { calculateProposalReceipts, calculateProposalServiceReceipts, getServiceAllocationError, getProposalServicesLabel } from "./proposalPayments";
import { SERVICE_OPTIONS } from "./commercialProposal";

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

describe("recebimentos mensais por serviço", () => {
  const services = [{ servico: "BPO" as const, valor: 30000 }, { servico: "CFO" as const, valor: 20000 }];
  it.each(SERVICE_OPTIONS)("personaliza e preserva o total para $label", ({ value }) => {
    const plan = calculateProposalServiceReceipts([{ servico: value, valor: 50000.01 }], 50000.01, 12,
      [{ numero: 1, valor: 3000, servicos: [{ servico: value, valor: 3000 }] }]);
    expect(plan.error).toBeNull();
    expect(plan.recebimentos[0]).toEqual({ numero: 1, valor: 3000, servicos: [{ servico: value, valor: 3000 }] });
    expect(sumCents(plan.recebimentos)).toBe(5000001);
    expect(plan.recebimentos.every((receipt) => receipt.servicos?.length === 1 && receipt.servicos[0].servico === value)).toBe(true);
  });

  it("preserva os valores de todos os serviços juntos em um mesmo plano mensal", () => {
    const selected = SERVICE_OPTIONS.map(({ value }, index) => ({ servico: value, valor: (index + 1) * 1000 + 0.01 }));
    const monthly = selected.map(({ servico }, index) => ({ servico, valor: index % 2 === 0 ? 0 : (index + 1) * 10 + 0.01 }));
    const total = sumCents(selected) / 100;
    const plan = calculateProposalServiceReceipts(selected, total, 12, [{ numero: 1, valor: sumCents(monthly) / 100, servicos: monthly }]);
    expect(plan.error).toBeNull();
    expect(plan.recebimentos[0].servicos).toEqual(monthly);
    expect(sumCents(plan.recebimentos)).toBe(sumCents(selected));
    for (const service of selected) expect(sumCents(plan.recebimentos.map((receipt) => receipt.servicos!.find((item) => item.servico === service.servico)!))).toBe(Math.round(service.valor * 100));
  });

  it("preserva os totais de cada serviço ao personalizar o primeiro mês", () => {
    const plan = calculateProposalServiceReceipts(services, 50000, 12, [{ numero: 1, valor: 3000, servicos: [{ servico: "BPO", valor: 1000 }, { servico: "CFO", valor: 2000 }] }]);
    expect(plan.error).toBeNull();
    expect(plan.recebimentos[0].servicos).toEqual([{ servico: "BPO", valor: 1000 }, { servico: "CFO", valor: 2000 }]);
    expect(plan.recebimentos[0].valor).toBe(3000);
    for (const service of services) expect(sumCents(plan.recebimentos.map((item) => item.servicos!.find((entry) => entry.servico === service.servico)!))).toBe(Math.round(service.valor * 100));
    expect(sumCents(plan.recebimentos)).toBe(5000000);
    for (const receipt of plan.recebimentos) expect(sumCents(receipt.servicos!)).toBe(Math.round(receipt.valor * 100));
  });

  it("permite que um serviço seja pago só em alguns meses", () => {
    const plan = calculateProposalServiceReceipts(services, 50000, 2, [{ numero: 1, valor: 30000, servicos: [{ servico: "BPO", valor: 30000 }, { servico: "CFO", valor: 0 }] }]);
    expect(plan.error).toBeNull();
    expect(plan.recebimentos[1]).toEqual({ numero: 2, valor: 20000, servicos: [{ servico: "BPO", valor: 0 }, { servico: "CFO", valor: 20000 }] });
  });

  it("recusa distribuição por serviço incorreta mesmo quando o total geral confere", () => {
    const plan = calculateProposalServiceReceipts(services, 50000, 1, [{ numero: 1, valor: 50000, servicos: [{ servico: "BPO", valor: 31000 }, { servico: "CFO", valor: 19000 }] }]);
    expect(plan.error).toContain("BPO");
    expect(calculateProposalServiceReceipts(services, 50000, 2, [{ numero: 1, valor: 1000, servicos: [{ servico: "BPO", valor: 1000 }, { servico: "CFO", valor: -1 }] }]).error).toBeTruthy();
  });

  it("preserva centavos por serviço em todos os planos e converte recebimentos antigos", () => {
    const fractional = [{ servico: "BPO" as const, valor: 30000.01 }, { servico: "CFO" as const, valor: 19999.99 }];
    for (let count = 1; count <= 24; count++) {
      const plan = calculateProposalServiceReceipts(fractional, 50000, count);
      expect(plan.error).toBeNull();
      for (const service of fractional) expect(sumCents(plan.recebimentos.map((item) => item.servicos!.find((entry) => entry.servico === service.servico)!))).toBe(Math.round(service.valor * 100));
    }
    const converted = calculateProposalServiceReceipts(services, 50000, 12, [{ numero: 1, valor: 3000 }]);
    expect(converted.recebimentos[0].servicos).toEqual([{ servico: "BPO", valor: 1800 }, { servico: "CFO", valor: 1200 }]);
    expect(converted.error).toBeNull();
  });
});
