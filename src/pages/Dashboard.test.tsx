import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import Dashboard from "./Dashboard";

const mocks = vi.hoisted(() => ({ nomeUsuario: "Aryadne Lima", reunioes: [] as import("@/services/useReunioes").Reuniao[], create: vi.fn() }));
vi.mock("@/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/services/useUsuarios", () => ({ useUsuarios: () => ({ data: [{ id: 2, nomeCompleto: "Ana", email: "ana@example.test" }] }) }));
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
    useDocumentos: () => ({ data: [] }), usePropostas: () => ({ data: [] }), useReunioes: () => ({ data: mocks.reunioes }),
    useCreateReuniao: () => ({ mutateAsync: mocks.create, isPending: false }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.nomeUsuario = "Aryadne Lima"; mocks.reunioes = [];
  vi.mocked(api.get).mockResolvedValue({ data: [{ email: "sala@resource.calendar.google.com", nome: "Sala 1" }] });
  vi.mocked(api.post).mockResolvedValue({ data: {
    salas: [{ email: "sala@resource.calendar.google.com", disponivel: true }],
    participantes: [{ id: 2, disponivel: true }], localDisponivel: true,
  } });
});
const abrir = () => render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><Dashboard /></MemoryRouter></QueryClientProvider>);
const pipeline = () => within(screen.getByText("Pipeline dos Contratos").parentElement!.parentElement!.parentElement!);

describe("responsáveis exibidos na Home", () => {
  it("mostra o técnico de cada contrato, independentemente de quem está acessando", () => {
    const view = abrir();
    expect(pipeline().getAllByText("Vitor Alcântara")).toHaveLength(2);
    expect(pipeline().getByText("Marcio Souza")).toBeInTheDocument();
    expect(pipeline().queryByText("Aryadne Lima")).not.toBeInTheDocument();
    expect(pipeline().queryByText("Responsável Comercial")).not.toBeInTheDocument();
    mocks.nomeUsuario = "Outra usuária";
    view.rerender(<QueryClientProvider client={new QueryClient()}><MemoryRouter><Dashboard /></MemoryRouter></QueryClientProvider>);
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

describe("reuniões por dia no Dashboard", () => {
  it("remove canceladas da agenda, dos indicadores e dos lembretes da Home", async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const data = `${today.getFullYear()}-${month}-19`;
    const ativa = { id: 3, titulo: "Reunião ativa", dataHora: `${data}T10:00:00`, data, local: "Sala 1", status: "AGENDADA" };
    mocks.reunioes = [{ ...ativa, id: 4, titulo: "Planejamento cancelado", status: "CANCELADA" },
      { ...ativa, id: 5, titulo: "Treinamento cancelado", status: "CANCELADO" }, ativa];
    abrir();
    expect(screen.queryByText(/Planejamento cancelado|Treinamento cancelado/)).not.toBeInTheDocument();
    expect(screen.getByText("1 reuniões cadastradas")).toBeInTheDocument();
    const label = `19/${month}/${today.getFullYear()}, 1 reunião`;
    expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ampliar Calendário" }));
    fireEvent.click(screen.getAllByRole("button", { name: label }).at(-1)!);
    const dialog = within(screen.getAllByRole("dialog").at(-1)!);
    expect(dialog.getByRole("button", { name: /^Reunião ativa / })).toBeInTheDocument();
    expect(dialog.queryByRole("button", { name: /cancelado/ })).not.toBeInTheDocument();
  });

  const abrirAgendamento = () => {
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "Ampliar Calendário" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar reunião" }));
    fireEvent.change(screen.getByPlaceholderText("Título"), { target: { value: "Alinhamento da equipe" } });
  };

  it("agenda pela Home com término explícito e disponibilidade durante todo o intervalo", async () => {
    abrirAgendamento();
    fireEvent.change(screen.getByLabelText("Início *"), { target: { value: "15:00" } });
    fireEvent.change(screen.getByLabelText("Término *"), { target: { value: "17:30" } });
    fireEvent.click(screen.getByRole("checkbox"));
    await screen.findByRole("option", { name: "Sala 1 — Disponível" });
    fireEvent.change(screen.getByLabelText("Sala física"), { target: { value: "sala@resource.calendar.google.com" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirmar" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      hora: "15:00", horaFim: "17:30", salaEmail: "sala@resource.calendar.google.com", participanteIds: [2],
    })));
    expect(api.post).toHaveBeenCalledWith("/reunioes/disponibilidade", expect.objectContaining({ hora: "15:00", horaFim: "17:30" }), expect.any(Object));
  });

  it("não permite confirmar sem término ou com término anterior ao início", async () => {
    abrirAgendamento();
    fireEvent.change(screen.getByLabelText("Início *"), { target: { value: "15:00" } });
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Término *"), { target: { value: "14:00" } });
    expect(screen.getByText("O término deve ser posterior ao início da reunião.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("bloqueia a sala quando o novo término passa a conflitar com outra reunião", async () => {
    vi.mocked(api.post).mockImplementation(async (_url, request) => ({ data: {
      salas: [{ email: "sala@resource.calendar.google.com", disponivel: (request as { horaFim: string }).horaFim < "17:00" }],
      participantes: [{ id: 2, disponivel: true }], localDisponivel: true,
    } }));
    abrirAgendamento();
    fireEvent.change(screen.getByLabelText("Início *"), { target: { value: "15:00" } });
    fireEvent.change(screen.getByLabelText("Término *"), { target: { value: "16:00" } });
    await screen.findByRole("option", { name: "Sala 1 — Disponível" });
    fireEvent.change(screen.getByLabelText("Sala física"), { target: { value: "sala@resource.calendar.google.com" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirmar" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Término *"), { target: { value: "17:00" } });
    expect(await screen.findByRole("option", { name: "Sala 1 — Ocupada" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("exibe o local físico mesmo quando a reunião também tem Meet", () => {
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-19`;
    const nome = "Escritório Climbe Cont - Hermes Fontes-2-Sala de Reunião - Climbe Cont (6)";
    mocks.reunioes = [{ id: -3, titulo: "Treinamento CRM", data: date, dataHora: `${date}T11:00:00`, local: nome, linkMeet: "https://meet.google.com/abc-defg-hij", presencial: false }];
    abrir();
    fireEvent.click(screen.getByRole("button", { name: /19\/.*1 reunião$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar reuniões do dia" }));
    const calendario = within(screen.getByText("Calendário").closest<HTMLElement>(".rounded-xl")!);
    expect(calendario.getByText(nome)).toBeInTheDocument();
    expect(calendario.queryByText(mocks.reunioes[0].linkMeet!)).not.toBeInTheDocument();
  });

  it.each([false, true])("abre a lista do dia no calendário ampliado=%s e reabre o mesmo dia", async (ampliado) => {
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-19`;
    const label = `19/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}, 2 reuniões`;
    mocks.reunioes = [
      { id: 3, titulo: "Reunião da equipe", data: date, dataHora: `${date}T10:00:00`, local: "Sala 1" },
      { id: 4, titulo: "Reunião com cliente", data: date, dataHora: `${date}T11:00:00`, local: "Sala 2" },
    ];
    abrir();
    if (ampliado) fireEvent.click(screen.getByRole("button", { name: "Ampliar Calendário" }));
    const day = screen.getAllByRole("button", { name: label }).at(-1)!;
    fireEvent.click(day);
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("button", { name: /^Reunião da equipe / })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: /^Reunião com cliente / })).toBeInTheDocument();
    fireEvent.click(dialog.getByRole("button", { name: "Fechar reuniões do dia" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(day);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("seleciona um dia sem reuniões sem abrir o modal", () => {
    abrir();
    fireEvent.click(screen.getAllByRole("button", { name: /, sem reuniões/ })[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
