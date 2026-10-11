import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import PipelineVendas from "./PipelineVendas";

const fixture = vi.hoisted(() => ({
  negocio: { id: 10, funilId: 1, nomeEmpresa: "Empresa", resultado: "ABERTO", responsavelId: 99, responsavelNome: "Outra pessoa" },
  mutation: { isPending: false, mutateAsync: vi.fn() },
}));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ basicUserData: { id: 1 } }) }));
vi.mock("@/services/usePermissoes", () => ({ useUsuarioPermissoes: () => ({ data: [{ permissao: { codigo: "COMERCIAL" } }], isLoading: false }) }));
vi.mock("@/services/usePipelineCadastros", () => ({ useCampanhasOpcoes: () => ({ data: [] }), usePipelineTags: () => ({ data: [] }) }));
vi.mock("@/services/useUsuarios", () => ({ useUsuarios: () => ({ data: [] }) }));
vi.mock("@/services/useEmpresas", () => ({ useEmpresas: () => ({ data: [] }) }));
vi.mock("@/services/usePipelineMotivosPerda", () => ({ usePipelineMotivosPerdaAtivos: () => ({ data: [] }) }));
vi.mock("@/services/usePipelineFunis", () => ({ usePipelineFunisAtivos: () => ({ data: [
  { id: 1, tipo: "VENDAS", nome: "Vendas" }, { id: 2, tipo: "PRE_VENDAS", nome: "Pré-vendas" },
] }) }));
vi.mock("@/services/usePipelineVendas", () => ({
  usePipelineVendas: () => ({ data: { etapas: [{ id: 1, negocios: [fixture.negocio] }] } }),
  useCreatePipelineNegocio: () => fixture.mutation, useUpdatePipelineNegocio: () => fixture.mutation,
  useMovePipelineNegocio: () => fixture.mutation, useConcludePipelineNegocio: () => fixture.mutation,
  useReactivatePipelineNegocio: () => fixture.mutation, useConvertPipelineNegocio: () => fixture.mutation,
}));
vi.mock("@/services/usePipelineAtividades", () => ({ usePipelineTarefa: () => ({}) }));
vi.mock("@/components/pipeline/PipelineVendasShell", () => ({ PipelineVendasShell: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/pipeline/PipelineKanbanBoard", () => ({ PipelineKanbanBoard: ({ onOpen }: { onOpen: (negocio: unknown) => void }) => <button onClick={() => onOpen(fixture.negocio)}>Abrir negócio</button> }));
vi.mock("@/components/pipeline/PipelineTarefasVisao", () => ({ PipelineTarefasVisao: ({ canView, canViewAll, canEdit, canConclude }: Record<string, boolean>) => <div>
  {canView && <p>Tarefas visíveis</p>}{canViewAll && <p>Todos os responsáveis</p>}
  {canEdit && <button>Editar tarefa</button>}{canConclude && <button>Concluir tarefa</button>}
</div> }));
vi.mock("@/components/pipeline/PipelineNegocioDialog", () => ({ PipelineNegocioDialog: ({ canViewTasks, canCreateTask, canEditTask, canConcludeTask }: Record<string, boolean>) => <div>
  {canViewTasks && <p>Tarefas do negócio visíveis</p>}{canCreateTask && <button>Criar tarefa</button>}
  {canEditTask && <button>Editar tarefa</button>}{canConcludeTask && <button>Concluir tarefa</button>}
</div> }));

describe("leitura das tarefas com acesso ao Comercial", () => {
  it.each([false, true])("permite ler tarefas na visão principal e no item, preservando permissões de escrita (pré-vendas: %s)", preVendas => {
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><PipelineVendas preVendas={preVendas} /></MemoryRouter></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: /^Tarefas$/ }));
    expect(screen.getByText("Tarefas visíveis")).toBeInTheDocument();
    expect(screen.getByText("Todos os responsáveis")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar tarefa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Concluir tarefa" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Pipeline$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Abrir negócio" }));
    expect(screen.getByText("Tarefas do negócio visíveis")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar tarefa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar tarefa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Concluir tarefa" })).not.toBeInTheDocument();
  });
});
