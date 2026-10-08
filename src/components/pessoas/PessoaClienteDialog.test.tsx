import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Empresa } from "@/services/useEmpresas";
import { PessoaClienteDialog } from "./PessoaClienteDialog";

const empresa: Empresa = {
  id: 1,
  nome: "Climbe",
  cnpj: "00.000.000/0001-00",
  email: "",
  telefone: "",
  endereco: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  uf: "",
  cep: "",
  representanteNome: "",
  representanteCpf: "",
  representanteContato: "",
  dataCriacao: "",
  dataAtualizacao: "",
};

describe("PessoaClienteDialog", () => {
  it("impede o cadastro sem CPF e remove o destaque ao preencher o campo", () => {
    const onSave = vi.fn();
    render(<PessoaClienteDialog pessoa={null} empresas={[empresa]} isProcessing={false} onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Nome completo *" }), { target: { value: "Maria Silva" } });
    fireEvent.click(screen.getByRole("button", { name: /Climbe/ }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar pessoa" }));

    const cpf = screen.getByRole("textbox", { name: /^CPF/ });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Por favor, preencha “CPF” para continuar.");
    expect(cpf).toHaveAccessibleName("CPF *");
    expect(cpf).toHaveFocus();
    expect(cpf).toHaveAttribute("data-field-error", "true");
    expect(cpf).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(cpf, { target: { value: "52998224725" } });
    expect(cpf).toHaveValue("529.982.247-25");
    expect(cpf).not.toHaveAttribute("data-field-error");
    expect(cpf).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salvar pessoa" }));
    expect(onSave).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ nome: "Maria Silva", cpf: "529.982.247-25", empresaIds: [1] }));
  });
});
