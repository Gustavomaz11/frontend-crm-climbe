import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContratoEquipeDialog } from "./ContratoEquipeDialog";
import { RateioTecnicoResumo } from "./ContratoRateioTecnico";
import type { ContratoEquipe, ContratoRateioTecnico } from "@/services/useContratoEquipe";

const mocks = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("@/services/useContratoEquipe", () => ({
  useSalvarContratoEquipe: () => ({ mutateAsync: mocks.save, isPending: false }),
  useContratoRateioTecnico: () => ({ data: undefined }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const usuarios = [{ id: 1, nomeCompleto: "Ana" }, { id: 2, nomeCompleto: "Bia" }, { id: 3, nomeCompleto: "Caio" }];
const equipe: ContratoEquipe = { contratoId: 12, configurada: false, lider: true, responsavel: usuarios[0], membros: [], usuariosDisponiveis: usuarios, temporarios: [] };
beforeEach(() => { vi.clearAllMocks(); mocks.save.mockResolvedValue({}); });

describe("equipe e rateio técnico do contrato", () => {
  it("exige seleção e permite salvar várias pessoas antes de abrir o quadro", async () => {
    const onSaved = vi.fn();
    render(<ContratoEquipeDialog equipe={equipe} titulo="Empresa · Contabilidade" usuarios={usuarios} onClose={vi.fn()} onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Atribuir Ana" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar equipe e abrir kanban" }));
    expect(mocks.save).not.toHaveBeenCalled();
    expect(screen.getByRole("group", { name: "Equipe fixa" })).toHaveAttribute("data-field-error", "true");
    fireEvent.click(screen.getByRole("checkbox", { name: "Atribuir Bia" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Atribuir Caio" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salvar equipe e abrir kanban" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ id: 12, usuarioIds: [2, 3] }));
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it("mostra tarefas pendentes do apoio e mantém a janela aberta se salvar falhar", async () => {
    mocks.save.mockRejectedValue(new Error("Não foi possível salvar a equipe."));
    const onSaved = vi.fn();
    render(<ContratoEquipeDialog equipe={{ ...equipe, configurada: true, membros: [usuarios[0]], temporarios: [{ usuario: usuarios[2], tarefas: [{ id: 40, titulo: "Conciliação" }] }] }} titulo="Empresa" usuarios={usuarios} onClose={vi.fn()} onSaved={onSaved} />);
    expect(screen.getByText("Conciliação")).toBeInTheDocument();
    expect(screen.getByText(/O acesso dura até concluir as tarefas atribuídas/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salvar equipe" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("mostra serviços genéricos e os valores individuais sem aumentar a comissão", () => {
    const rateio: ContratoRateioTecnico = { contratoId: 12, competencia: "2026-10", competenciaPagamento: "2026-11", registrado: true, recebimentoTotal: 1000.1, comissaoTecnicaTotal: 100.01,
      servicos: [{ servico: "CONTABILIDADE", recebimento: 500.05, percentual: 10, comissao: 50 }, { servico: "VALUATION", recebimento: 500.05, percentual: 10, comissao: 50.01 }],
      participantes: usuarios.map((usuario, index) => ({ usuario, valor: index < 2 ? 33.34 : 33.33 })) };
    render(<RateioTecnicoResumo rateio={rateio} />);
    expect(screen.getByText(/Comissão técnica do mês/)).toHaveTextContent("R$ 100,01");
    expect(screen.getByText(/Atuação em/)).toHaveTextContent("Atuação em outubro de 2026 · Pagamento em novembro de 2026");
    expect(screen.getByText(/Contabilidade · 10%/)).toBeInTheDocument();
    expect(screen.getByText(/Valuation · 10%/)).toBeInTheDocument();
    const linhas = screen.getAllByRole("row").slice(1);
    expect(linhas).toHaveLength(3);
    expect(within(linhas[0]).getAllByRole("cell")[1]).toHaveTextContent("R$ 33,34");
    expect(within(linhas[2]).getAllByRole("cell")[1]).toHaveTextContent("R$ 33,33");
  });
});
