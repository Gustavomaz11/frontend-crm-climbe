import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContratosKanban from "./ContratosKanban";

const mocks = vi.hoisted(() => ({ equipe: {} as Record<string, unknown>, board: {} as Record<string, unknown>, buscarBoard: vi.fn() }));
vi.mock("@/services", async importOriginal => {
  const original = await importOriginal<typeof import("@/services")>();
  const mutation = () => ({ mutateAsync: vi.fn(), isPending: false });
  return { ...original,
    useContratosKanbanDisponiveis: () => ({ data: [{ id: 12, empresaNome: "Empresa teste", titulo: "contrato.pdf", status: "APROVADO", servico: "CONTABILIDADE" }] }),
    useContratoEquipe: (id?: number) => ({ data: id ? mocks.equipe : undefined }),
    useContratoKanban: (id?: number) => { mocks.buscarBoard(id); return { data: id ? mocks.board : undefined }; },
    useUsuarios: () => ({ data: [] }),
    ...Object.fromEntries(["useCreateKanbanSubtarefa", "useCreateKanbanRaia", "useCreateKanbanTask", "useDeleteKanbanSubtarefa", "useDeleteKanbanRaia", "useDeleteKanbanTask", "useMoveKanbanTask", "useToggleKanbanSubtarefa", "useUpdateKanbanSubtarefa", "useUpdateKanbanRaia", "useUpdateKanbanTask"].map(name => [name, mutation])),
  };
});
vi.mock("@/components/kanban/ContratoEquipeDialog", () => ({ ContratoEquipeDialog: () => <div role="dialog">Selecionar equipe</div> }));
vi.mock("@/components/kanban/ContratoRateioTecnico", () => ({ ContratoRateioTecnicoPanel: () => null }));
vi.mock("@/components/layout/AppSidebarNav", () => ({ AppSidebarNav: () => null }));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (value: unknown) => unknown) => selector({ basicUserData: { id: 1, nomeCompleto: "Ana" }, userData: null }) }));
vi.mock("@/hooks/use-theme", () => ({ useTheme: () => ({ isDark: true, setIsDark: vi.fn() }) }));
vi.mock("@/hooks/useSidebarState", () => ({ useSidebarState: () => [false, vi.fn()] }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.equipe = { contratoId: 12, configurada: false, lider: true, membros: [], temporarios: [], usuariosDisponiveis: [] };
  mocks.board = { contratoId: 12, gestor: false, podeEditar: true, participantes: [], usuariosDisponiveis: [], raias: [{ id: 1, titulo: "A fazer", tasks: [] }] };
});
const abrir = (url = "/contratos/kanban") => render(<MemoryRouter initialEntries={[url]}><ContratosKanban /></MemoryRouter>);

describe("abertura do kanban do contrato", () => {
  it("solicita equipe ao clicar no contrato e só consulta o quadro após configurá-la", () => {
    abrir();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Empresa teste - Contabilidade/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Selecionar equipe");
    expect(mocks.buscarBoard).not.toHaveBeenCalledWith(12);
    expect(screen.queryByRole("button", { name: "Adicionar tarefa" })).not.toBeInTheDocument();
  });

  it("membro pode criar tarefas mesmo sem ser o gestor do contrato", () => {
    mocks.equipe = { ...mocks.equipe, configurada: true, lider: false };
    abrir("/contratos/kanban?contrato=12");
    expect(screen.getByRole("button", { name: "Adicionar tarefa" })).toBeInTheDocument();
    expect(screen.queryByText("Gerenciar equipe do contrato")).not.toBeInTheDocument();
    expect(mocks.buscarBoard).toHaveBeenCalledWith(12);
  });

  it("leitor administrativo não seleciona equipe nem cria tarefas", () => {
    mocks.equipe = { ...mocks.equipe, configurada: true, lider: false };
    mocks.board = { ...mocks.board, podeEditar: false };
    abrir("/contratos/kanban?contrato=12");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adicionar tarefa" })).not.toBeInTheDocument();
  });
});
