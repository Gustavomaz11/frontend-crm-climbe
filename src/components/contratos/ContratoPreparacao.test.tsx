import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContratoPreparacaoDialog } from "./ContratoPreparacaoDialog";
import { ContratoPreparacaoBoard } from "./ContratoPreparacaoBoard";
import { getContratoPreparacaoEtapa } from "@/services/contratoPreparacao";
import type { Contrato } from "@/services/useContratos";
import { toast } from "sonner";
const mocks = vi.hoisted(() => ({ move: vi.fn(), send: vi.fn() }));
vi.mock("@/services/useContratos", () => ({ useMoveContratoPreparacao: () => ({ mutateAsync: mocks.move, isPending: false }), useEnviarContratoCliente: () => ({ mutateAsync: mocks.send, isPending: false }), getContratoDownloadUrl: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const contrato = { id: 10, empresaNome: "Empresa", titulo: "Contrato sem arquivo", status: "PENDENTE", etapaPreparacao: "A_FAZER", valor: 50000, propostaId: 40, propostaTitulo: "proposta.pdf", responsavelComercialNome: "Comercial", responsavelNome: "Técnico", participantes: [], parcelas: [], servicos: [{ servico: "CONTABILIDADE", valor: 30000 }, { servico: "VALUATION", valor: 20000 }] } as Contrato;
const props = { contrato, canEdit: true, onClose: vi.fn(), onReview: vi.fn(), onManage: vi.fn() };
const selectFile = (file: File) => {
  const input = screen.getByLabelText("Contrato em PDF");
  // jsdom does not update the native file input value when a FileList is supplied.
  Object.defineProperty(input, "value", { configurable: true, value: `C:\\fakepath\\${file.name}` });
  Object.defineProperty(input, "validity", { configurable: true, value: { valid: true, valueMissing: false } });
  fireEvent.change(input, { target: { files: [file] } });
};
beforeEach(() => { vi.clearAllMocks(); mocks.move.mockResolvedValue({}); mocks.send.mockResolvedValue({ emailStatus: "ENVIADO" }); });

describe("preparação de contratos", () => {
  it("coloca o novo contrato em À fazer e os aprovados em Concluído", () => {
    render(<ContratoPreparacaoBoard contratos={[contrato, { ...contrato, id: 11, status: "APROVADO" }]} canEdit onOpen={vi.fn()} />);
    expect(screen.getByRole("region", { name: "À fazer" })).toHaveTextContent("Criação de Contrato - Empresa - Contabilidade + Valuation");
    expect(screen.getByRole("region", { name: "Concluído" })).toHaveTextContent("CT-11");
    expect(getContratoPreparacaoEtapa({ ...contrato, etapaPreparacao: null, urlPdf: "arquivo.pdf" })).toBe("REVISAO");
  });

  it("mostra os valores por serviço e salva a etapa pelo botão no rodapé", async () => {
    render(<ContratoPreparacaoDialog {...props} />);
    expect(screen.getByText(/Contabilidade · R\$ 30.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/Valuation · R\$ 20.000,00/)).toBeInTheDocument();
    expect(screen.getByText("Comercial")).toBeInTheDocument();
    expect(screen.getByText("Técnico")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Coluna do contrato"), { target: { value: "EM_ANDAMENTO" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(mocks.move).toHaveBeenCalledWith({ id: 10, etapa: "EM_ANDAMENTO" }));
  });

  it("exige um arquivo e envia o PDF selecionado no contrato existente", async () => {
    render(<ContratoPreparacaoDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar contrato ao cliente" }));
    expect(mocks.send).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Contrato em PDF")).toHaveAttribute("aria-invalid", "true");
    const file = new File(["pdf"], "contrato.pdf", { type: "application/pdf" });
    selectFile(file);
    fireEvent.click(screen.getByRole("button", { name: "Enviar contrato ao cliente" }));
    await waitFor(() => expect(mocks.send).toHaveBeenCalledWith({ id: 10, file }));
  });

  it("informa falha de email e oferece reenvio, sem anunciar sucesso", async () => {
    mocks.send.mockResolvedValue({ emailStatus: "FALHOU" });
    const { rerender } = render(<ContratoPreparacaoDialog {...props} />);
    selectFile(new File(["pdf"], "contrato.pdf"));
    fireEvent.click(screen.getByRole("button", { name: "Enviar contrato ao cliente" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("e-mail não foi enviado")));
    expect(toast.success).not.toHaveBeenCalled();
    rerender(<ContratoPreparacaoDialog {...props} contrato={{ ...contrato, urlPdf: "contrato.pdf", etapaPreparacao: "REVISAO" }} />);
    expect(screen.getByRole("button", { name: "Revisão do cliente, versões e reenvio" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("O e-mail não foi enviado");
  });
});
