import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

const mocks = vi.hoisted(() => ({ nomeUsuario: "Aryadne Lima" }));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (state: unknown) => unknown) =>
  selector({ basicUserData: { id: 7, nomeCompleto: mocks.nomeUsuario }, userData: null }) }));
vi.mock("@/components/layout/AppSidebarNav", () => ({ AppSidebarNav: () => null }));
vi.mock("@/components/NotificationBell", () => ({ NotificationBell: () => null }));
vi.mock("@/hooks/use-theme", () => ({ useTheme: () => ({ isDark: true, setIsDark: vi.fn() }) }));
vi.mock("@/hooks/useSidebarState", () => ({ useSidebarState: () => [false, vi.fn()] }));
vi.mock("@/hooks/useContratoPermissions", () => ({ useContratoPermissions: () => ({ canRead: true }) }));
vi.mock("@/hooks/useCrudPermissions", () => ({ useCrudPermissions: () => ({ canRead: true }) }));
vi.mock("@/services/useNotificacoes", async importOriginal => ({
  ...await importOriginal<typeof import("@/services/useNotificacoes")>(),
  useMinhasNotificacoes: () => ({ data: [] }), useLerNotificacao: () => ({ mutate: vi.fn() }),
}));
vi.mock("@/services", async importOriginal => {
  const original = await importOriginal<typeof import("@/services")>();
  const contratos = [
    { id: 1, responsavel: { id: 10, nomeCompleto: "Vitor Alcântara" } },
    { id: 2, responsavel: { id: 10, nomeCompleto: "Vitor Alcântara" } },
    { id: 3, responsavel: { id: 11, nomeCompleto: "Marcio Souza" } },
    { id: 4, responsavel: null },
  ].map(contrato => original.normalizeContrato({
    ...contrato, empresa: { idEmpresa: 1, nomeFantasia: "Jota" }, empresaNomeFantasia: "Jota", status: "APROVADO",
    responsavelComercial: { id: 12, nomeCompleto: "Responsável Comercial" }, urlPdf: `contrato-${contrato.id}.pdf`,
  }));
  return { ...original,
    useContratos: () => ({ data: contratos }),
    useEmpresas: () => ({ data: [original.normalizeEmpresa({ id: 1, nome: "Jota" }), original.normalizeEmpresa({ id: 2, nome: "Empresa sem contrato" })] }),
    useDocumentos: () => ({ data: [] }), usePropostas: () => ({ data: [] }), useReunioes: () => ({ data: [] }),
    useCreateReuniao: () => ({ mutateAsync: vi.fn(), isPending: false }),
  };
});

beforeEach(() => { mocks.nomeUsuario = "Aryadne Lima"; });
const abrir = () => render(<MemoryRouter><Dashboard /></MemoryRouter>);
const pipeline = () => within(screen.getByText("Pipeline dos Contratos").parentElement!.parentElement!.parentElement!);

describe("responsáveis exibidos na Home", () => {
  it("mostra o técnico de cada contrato, independentemente de quem está acessando", () => {
    const view = abrir();
    expect(pipeline().getAllByText("Vitor Alcântara")).toHaveLength(2);
    expect(pipeline().getByText("Marcio Souza")).toBeInTheDocument();
    expect(pipeline().queryByText("Aryadne Lima")).not.toBeInTheDocument();
    expect(pipeline().queryByText("Responsável Comercial")).not.toBeInTheDocument();
    mocks.nomeUsuario = "Outra usuária";
    view.rerender(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(pipeline().getAllByText("Vitor Alcântara")).toHaveLength(2);
    expect(pipeline().getByText("Marcio Souza")).toBeInTheDocument();
    expect(pipeline().queryByText("Outra usuária")).not.toBeInTheDocument();
  });

  it("informa quando um contrato não tem responsável técnico definido", () => {
    abrir();
    expect(pipeline().getByText("Não definido")).toBeInTheDocument();
  });

  it("agrupa os técnicos da empresa sem repetir nomes e mantém a informação na janela ampliada", () => {
    abrir();
    expect(screen.getByText(/4 contratos.*Vitor Alcântara, Marcio Souza/)).toBeInTheDocument();
    expect(screen.getByText(/0 contratos.*Não definido/)).toBeInTheDocument();
    const empresas = screen.getAllByText("Jota");
    fireEvent.click(empresas[empresas.length - 1]);
    fireEvent.click(screen.getByRole("button", { name: /Voltar à lista/ }));
    expect(screen.getAllByText(/Vitor Alcântara, Marcio Souza/).length).toBeGreaterThanOrEqual(2);
  });
});
