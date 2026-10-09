import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormValidation } from "@/components/ui/form-validation";
import { buildProposalCommercialConfig } from "@/services/proposalPayments";
import type { PropostaCommercialConfig } from "@/services/usePropostas";
import { createEmptyProposalConfig, PropostaCommercialFields } from "./PropostaCommercialFields";

const Form = ({ save }: { save: (config: PropostaCommercialConfig) => void }) => {
  const [config, setConfig] = useState<PropostaCommercialConfig>({ ...createEmptyProposalConfig(), mesInicio: "2026-10" });
  return <FormValidation as="form" onSubmit={(event) => { event.preventDefault(); save(buildProposalCommercialConfig(config, 50000)); }}>
    <PropostaCommercialFields value={config} valorTotal={50000} usuarios={[]} onChange={setConfig} />
    <button type="submit">Enviar</button>
  </FormValidation>;
};

describe("configuração comercial da proposta", () => {
  it("permite distribuir o valor, definir comissões independentes e personalizar dois recebimentos", () => {
    const save = vi.fn();
    render(<Form save={save} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar serviço" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    const secondValue = screen.getByRole("spinbutton", { name: /^Valor do serviço 2/ });
    expect(secondValue).toHaveAttribute("data-field-error", "true");
    fireEvent.change(screen.getByRole("spinbutton", { name: /^Valor do serviço 1/ }), { target: { value: "30000" } });
    fireEvent.change(secondValue, { target: { value: "20000" } });
    expect(secondValue).not.toHaveAttribute("data-field-error");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton", { name: /^Comissão técnica do serviço 1/ }), { target: { value: "25" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: /^Comissão comercial do serviço 2/ }), { target: { value: "10" } });
    for (const number of [1, 2]) {
      fireEvent.click(screen.getByRole("checkbox", { name: `Personalizar recebimento ${number}` }));
      fireEvent.change(screen.getByRole("spinbutton", { name: new RegExp(`^Valor de BPO no recebimento ${number} `) }), { target: { value: "1800" } });
      fireEvent.change(screen.getByRole("spinbutton", { name: new RegExp(`^Valor de CFO no recebimento ${number} `) }), { target: { value: "1200" } });
    }
    expect(screen.getByLabelText("Total do recebimento 3")).toHaveTextContent("4.400,00");
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(save).toHaveBeenCalledOnce();
    const submitted = save.mock.calls[0][0] as PropostaCommercialConfig;
    expect(submitted.servicos).toEqual([
      { servico: "BPO", valor: 30000, comissaoTecnicoPercentual: 25 },
      { servico: "CFO", valor: 20000, comissaoComercialPercentual: 10 },
    ]);
    expect(submitted.recebimentos.map((item) => item.valor)).toEqual([3000, 3000, ...Array(10).fill(4400)]);
    expect(submitted.recebimentos[0].servicos).toEqual([{ servico: "BPO", valor: 1800 }, { servico: "CFO", valor: 1200 }]);
  });

  it("bloqueia o envio quando o valor personalizado supera o total e permite restaurar a divisão", () => {
    const save = vi.fn();
    render(<Form save={save} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Personalizar recebimento 1" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: /^Valor de BPO no recebimento 1 / }), { target: { value: "60000" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole("group", { name: "Plano de recebimentos" })).toHaveAttribute("data-field-error", "true");
    fireEvent.click(screen.getByRole("button", { name: "Restaurar divisão automática" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(save).toHaveBeenCalledOnce();
  });

  it("destaca um valor mensal vazio e aceita zero depois que o serviço é preenchido", () => {
    const save = vi.fn();
    render(<Form save={save} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar serviço" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: /^Valor do serviço 1/ }), { target: { value: "30000" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: /^Valor do serviço 2/ }), { target: { value: "20000" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Personalizar recebimento 1" }));
    const monthlyBpo = screen.getByRole("spinbutton", { name: /^Valor de BPO no recebimento 1 / });
    fireEvent.change(monthlyBpo, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(save).not.toHaveBeenCalled();
    expect(monthlyBpo).toHaveAttribute("data-field-error", "true");
    fireEvent.change(monthlyBpo, { target: { value: "0" } });
    expect(monthlyBpo).not.toHaveAttribute("data-field-error");
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(save).toHaveBeenCalledOnce();
  });

  it("preserva a distribuição mensal ao trocar o serviço e remove valores de serviços excluídos", () => {
    const save = vi.fn();
    render(<Form save={save} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar serviço" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: /^Valor do serviço 1/ }), { target: { value: "30000" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: /^Valor do serviço 2/ }), { target: { value: "20000" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Personalizar recebimento 1" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: /^Valor de CFO no recebimento 1 / }), { target: { value: "1000" } });
    fireEvent.change(screen.getByRole("combobox", { name: /^Serviço 2/ }), { target: { value: "VALUATION" } });
    expect(screen.getByRole("spinbutton", { name: /^Valor de Valuation no recebimento 1 / })).toHaveValue(1000);
    fireEvent.click(screen.getByRole("button", { name: "Remover serviço 2" }));
    expect(screen.queryByRole("spinbutton", { name: /^Valor de Valuation no recebimento 1 / })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0].recebimentos[0].servicos).toEqual([{ servico: "BPO", valor: 2500 }]);
  });
});
