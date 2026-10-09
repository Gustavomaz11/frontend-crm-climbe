import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PipelineGanhoDialog } from "./PipelineGanhoDialog";
import { usePropostas } from "@/services/usePropostas";
import type { PipelineNegocio } from "@/services/usePipelineVendas";

vi.mock("@/services/usePropostas", async importOriginal => ({ ...await importOriginal<typeof import("@/services/usePropostas")>(), usePropostas: vi.fn() }));
vi.mock("@/components/users/UserSelect", () => ({ UserSelect: ({ required, value, onValueChange, ariaLabel }: { required: boolean; value: string; onValueChange: (value: string) => void; ariaLabel: string }) => <select required={required} aria-label={ariaLabel} value={value} onChange={e => onValueChange(e.target.value)}><option value="">Selecione</option><option value="2">Técnico</option></select> }));
const negocio = { id: 10, empresaId: 30, nomeEmpresa: "Empresa" } as PipelineNegocio;
const proposal = { idProposta: 40, empresaId: 30, usuarioId: 1, negocioId: 10, status: "APROVADA", revisaoStatus: "APROVADO", valuation: 50000, url: "http://storage.test/proposta.pdf", servicos: [{ servico: "CONTABILIDADE", valor: 30000 }, { servico: "VALUATION", valor: 20000 }] };
beforeEach(() => vi.mocked(usePropostas).mockReturnValue({ data: [proposal], isLoading: false, error: null } as ReturnType<typeof usePropostas>));

describe("conclusão da venda", () => {
  it("exige um técnico e envia os IDs da proposta aprovada e do técnico", () => {
    const confirm = vi.fn();
    render(<PipelineGanhoDialog negocio={negocio} usuarios={[]} isProcessing={false} onClose={vi.fn()} onConfirm={confirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Marcar como ganho" }));
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Responsável técnico pelo contrato")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Por favor");
    fireEvent.change(screen.getByLabelText("Responsável técnico pelo contrato"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Marcar como ganho" }));
    expect(confirm).toHaveBeenCalledWith(40, 2);
    expect(usePropostas).toHaveBeenCalledWith({ empresaId: 30, negocioId: 10 });
  });

  it("bloqueia o ganho quando a aprovação do cliente ainda está pendente", () => {
    vi.mocked(usePropostas).mockReturnValue({ data: [{ ...proposal, revisaoStatus: "AGUARDANDO_CLIENTE" }], isLoading: false, error: null } as ReturnType<typeof usePropostas>);
    render(<PipelineGanhoDialog negocio={negocio} usuarios={[]} isProcessing={false} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Marcar como ganho" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("precisa de uma proposta aprovada pelo cliente");
  });
});
