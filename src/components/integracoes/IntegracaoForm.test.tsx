import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IntegracaoForm } from "./IntegracaoForm";
import type { OperacaoIntegracao } from "@/services/useIntegracoes";

const catalogo: OperacaoIntegracao[] = [
  { codigo: "tecnico.ler", modulo: "TECNICO", metodo: "GET", caminho: "/tecnico/contratos", descricao: "Consultar contratos", payloadExemplo: "", respostaExemplo: "[]" },
  { codigo: "tecnico.criar", modulo: "TECNICO", metodo: "POST", caminho: "/tecnico/tarefas", descricao: "Criar tarefa", payloadExemplo: '{"titulo":"Exemplo"}', respostaExemplo: "{}" },
  { codigo: "juridico.ler", modulo: "JURIDICO", metodo: "GET", caminho: "/juridico/contratos", descricao: "Consultar contratos jurídicos", payloadExemplo: "", respostaExemplo: "[]" },
];
const props = { catalogo, empresas: [{ id: 7, nome: "Empresa autorizada", cnpj: "04252011000110" }], salvando: false, onSalvar: vi.fn(), onCancelar: vi.fn() };
describe("cadastro de integração", () => {
  it("remove autorizações incompatíveis ao trocar módulo ou método", () => {
    render(<IntegracaoForm {...props} />);
    const post = screen.getByLabelText("POST"); fireEvent.click(post);
    const criar = screen.getByLabelText(/Criar tarefa/); fireEvent.click(criar); expect(criar).toBeChecked();
    fireEvent.click(post); expect(screen.queryByLabelText(/Criar tarefa/)).not.toBeInTheDocument();
    fireEvent.click(post); expect(screen.getByLabelText(/Criar tarefa/)).not.toBeChecked();
    fireEvent.click(screen.getByLabelText(/Consultar contratos$/));
    fireEvent.change(screen.getByLabelText(/Módulo/), { target: { value: "JURIDICO" } });
    expect(screen.getByLabelText(/Consultar contratos jurídicos/)).not.toBeChecked();
    expect(screen.getByLabelText("POST")).not.toBeChecked();
  });
  it("exige seleção explícita das empresas e operações antes de salvar", () => {
    const onSalvar = vi.fn(); render(<IntegracaoForm {...props} onSalvar={onSalvar} />);
    fireEvent.submit(screen.getByRole("form", { name: "Nova integração" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Selecione ao menos uma empresa"); expect(onSalvar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/Empresa autorizada/));
    fireEvent.submit(screen.getByRole("form", { name: "Nova integração" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Selecione os métodos e as operações");
  });
  it.each(["POST", "PUT", "DELETE", "PATCH"])("oculta empresas e permite salvar somente %s mesmo sem empresas cadastradas", metodo => {
    const onSalvar = vi.fn();
    const gravacao: OperacaoIntegracao = { codigo: `tecnico.${metodo}`, modulo: "TECNICO", metodo, caminho: "/tecnico/tarefas/1", descricao: "Gravar tarefa de teste", payloadExemplo: "", respostaExemplo: "{}" };
    render(<IntegracaoForm {...props} empresas={[]} erroEmpresas catalogo={[catalogo[0], gravacao]} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByLabelText("GET")); fireEvent.click(screen.getByLabelText(metodo));
    expect(screen.queryByLabelText("Buscar empresa autorizada")).not.toBeInTheDocument();
    expect(screen.queryByText(/Não foi possível carregar as empresas/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Gravar tarefa de teste/));
    expect(screen.getByRole("button", { name: "Criar integração" })).toBeEnabled();
    fireEvent.submit(screen.getByRole("form", { name: "Nova integração" }));
    expect(onSalvar).toHaveBeenCalledWith(expect.objectContaining({ metodos: [metodo], empresaIds: [], operacoes: [gravacao.codigo] }));
  });
  it("exige empresas ao combinar GET com POST e volta a dispensá-las ao remover GET", () => {
    const onSalvar = vi.fn(); render(<IntegracaoForm {...props} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByLabelText("POST"));
    fireEvent.click(screen.getByLabelText(/Consultar contratos$/)); fireEvent.click(screen.getByLabelText(/Criar tarefa/));
    fireEvent.submit(screen.getByRole("form", { name: "Nova integração" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Selecione ao menos uma empresa autorizada para GET");
    expect(onSalvar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("GET"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.submit(screen.getByRole("form", { name: "Nova integração" }));
    expect(onSalvar).toHaveBeenCalledWith(expect.objectContaining({ metodos: ["POST"], empresaIds: [] }));
    fireEvent.click(screen.getByLabelText("GET"));
    expect(screen.getByLabelText("Buscar empresa autorizada")).toBeInTheDocument();
  });
  it("não envia seleções antigas de empresas ao salvar sem GET", () => {
    const onSalvar = vi.fn(); render(<IntegracaoForm {...props} onSalvar={onSalvar} />);
    fireEvent.click(screen.getByLabelText(/Empresa autorizada/));
    fireEvent.click(screen.getByLabelText("POST")); fireEvent.click(screen.getByLabelText("GET"));
    fireEvent.click(screen.getByLabelText(/Criar tarefa/));
    fireEvent.submit(screen.getByRole("form", { name: "Nova integração" }));
    expect(onSalvar).toHaveBeenCalledWith(expect.objectContaining({ empresaIds: [] }));
  });
});
