import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, cleanup, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import Agenda from "./Agenda";

const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), reunioes: [] as object[] }));
vi.mock("@/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/services", () => ({
  useReunioes: () => ({ data: mocks.reunioes }),
  useEmpresas: () => ({ data: [{ id: 1, nome: "Cliente" }] }),
  useParticipantesReuniao: () => ({ data: [] }),
  useCreateReuniao: () => ({ mutateAsync: mocks.create }),
  useUpdateReuniao: () => ({ mutateAsync: mocks.update }),
  useDeleteReuniao: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/services/useUsuarios", () => ({ useUsuarios: () => ({ data: [{ id: 2, nomeCompleto: "Ana", email: "ana@example.test" }] }) }));
vi.mock("@/components/layout/AppSidebar", () => ({ AppSidebar: () => null }));
vi.mock("@/components/layout/AppHeaderUser", () => ({ AppHeaderUser: () => null }));
vi.mock("@/components/kanban/KanbanArquivados", () => ({ KanbanArquivados: () => null, KanbanArquivarButton: () => null }));
vi.mock("@/hooks/useSidebarState", () => ({ useSidebarState: () => [false, vi.fn()] }));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (state: object) => unknown) => selector({}) }));

const setup = (path = "/agenda") => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const content = () => <QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Agenda /></MemoryRouter></QueryClientProvider>;
  const view = render(content());
  return { ...view, refresh: () => view.rerender(content()) };
};

describe("reuniões da equipe na agenda", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.reunioes = [];
    vi.mocked(api.get).mockResolvedValue({ data: [{ email: "sala@resource.calendar.google.com", nome: "Sala 1" }] });
    vi.mocked(api.post).mockResolvedValue({ data: { salas: [{ email: "sala@resource.calendar.google.com", disponivel: true }], participantes: [{ id: 2, disponivel: true }], localDisponivel: true } });
  });
  afterEach(cleanup);

  it("retira canceladas do calendário, da lista do dia e da lista de eventos, mantendo o histórico no Kanban", async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const data = `${today.getFullYear()}-${month}-19`;
    const ativa = { id: 3, titulo: "Reunião ativa", dataHora: `${data}T10:00:00`, data, hora: "10:00", local: "Sala 1", status: "AGENDADA" };
    mocks.reunioes = [ativa, { ...ativa, id: 4, titulo: "Planejamento cancelado", status: "CANCELADA" },
      { ...ativa, id: 5, titulo: "Treinamento cancelado", status: "CANCELADO" }];
    const view = setup();
    const dia = screen.getByRole("button", { name: `Reuniões em 19/${month}/${today.getFullYear()}` });
    expect(dia).toHaveTextContent("Reunião ativa");
    expect(screen.queryByText(/Planejamento cancelado|Treinamento cancelado/)).not.toBeInTheDocument();
    fireEvent.click(dia);
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText("1 reunião neste dia")).toBeInTheDocument();
    expect(dialog.queryByRole("button", { name: /cancelado/ })).not.toBeInTheDocument();
    fireEvent.click(dialog.getByRole("button", { name: "Fechar reuniões do dia" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Lista" }));
    await screen.findByText("Reunião ativa");
    expect(screen.queryByText(/Planejamento cancelado|Treinamento cancelado/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }));
    const cancelados = (await screen.findByText("Cancelado")).closest(".rounded-xl")!;
    expect(within(cancelados as HTMLElement).getByText("Planejamento cancelado")).toBeInTheDocument();
    expect(within(cancelados as HTMLElement).getByText("Treinamento cancelado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mês" }));
    const diaAtualizado = await screen.findByRole("button", { name: `Reuniões em 19/${month}/${today.getFullYear()}` });
    mocks.reunioes = mocks.reunioes.map(reuniao => ({ ...reuniao, status: "CANCELADA" }));
    view.refresh();
    expect(within(diaAtualizado).queryByText(/Reunião ativa/)).not.toBeInTheDocument();
    fireEvent.click(diaAtualizado);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre os detalhes de uma reunião cancelada pelo link da notificação", async () => {
    const cancelada = { id: 3, titulo: "Planejamento cancelado", dataHora: "2099-10-20T10:00:00", data: "2099-10-20", hora: "10:00", local: "Sala 1", status: "CANCELADA" };
    mocks.reunioes = [cancelada];
    vi.mocked(api.get).mockResolvedValue({ data: cancelada });
    setup("/agenda?reuniaoId=3");
    expect(await screen.findByText("Cancelada", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Planejamento cancelado" })).toBeInTheDocument();
  });

  it("abre o convite pelos detalhes para aceitar sem entrar no formulário de edição", async () => {
    const reuniao = { id: 3, titulo: "Convite da equipe", dataHora: "2099-10-20T10:00:00", dataHoraFim: "2099-10-20T11:00:00", data: "2099-10-20", hora: "10:00", local: "Sala 1", minhaResposta: "PENDENTE" };
    mocks.reunioes = [reuniao];
    vi.mocked(api.get).mockResolvedValue({ data: reuniao });
    setup("/agenda?reuniaoId=3");
    expect(await screen.findByRole("button", { name: "Aceitar reunião" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Convite da equipe" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar Agendamento" })).not.toBeInTheDocument();
  });

  it("abre a lista de reuniões ao clicar no dia do calendário", async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const data = `${today.getFullYear()}-${month}-19`;
    mocks.reunioes = [{ id: 3, titulo: "Alinhamento interno", empresaId: null, dataHora: `${data}T10:00:00`, data, hora: "10:00", local: "Sala 1", presencial: true }];
    setup();
    fireEvent.click(screen.getByRole("button", { name: `Reuniões em 19/${month}/${today.getFullYear()}` }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("button", { name: /Alinhamento interno/ })).toBeInTheDocument();
    fireEvent.click(dialog.getByRole("button", { name: "Fechar reuniões do dia" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("agenda sem cliente, com usuários e sala do Google", async () => {
    const { container } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Agendar" }));
    const formElement = container.querySelector<HTMLElement>('[data-form-validation]')!;
    const form = within(formElement);
    fireEvent.change(form.getByPlaceholderText("Pauta da reunião..."), { target: { value: "Reunião da equipe" } });
    fireEvent.change(formElement.querySelector('input[type="time"]')!, { target: { value: "10:00" } });
    fireEvent.click(form.getByRole("checkbox"));
    await screen.findByRole("option", { name: "Sala 1 — Disponível" });
    fireEvent.change(screen.getByLabelText("Sala física"), { target: { value: "sala@resource.calendar.google.com" } });
    expect(screen.getByLabelText("Cliente (opcional)")).toHaveValue("");
    await waitFor(() => expect(form.getByRole("button", { name: "Confirmar Agendamento" })).toBeEnabled());
    fireEvent.click(form.getByRole("button", { name: "Confirmar Agendamento" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ empresaId: null, participanteIds: [2], salaEmail: "sala@resource.calendar.google.com", local: "Sala 1", horaFim: "11:00" })));
  });

  it("reconsulta o intervalo completo e impede salvar a sala quando o término passa a conflitar", async () => {
    vi.mocked(api.post).mockImplementation(async (_url, request) => {
      const { horaFim } = request as { horaFim: string };
      return { data: {
        salas: [{ email: "sala@resource.calendar.google.com", disponivel: horaFim < "12:00" }],
        participantes: [{ id: 2, disponivel: horaFim < "12:00" }], localDisponivel: true,
      } };
    });
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Agendar" }));
    const form = within(document.querySelector('[data-form-validation]')!);
    fireEvent.change(screen.getByLabelText("Início *"), { target: { value: "10:00" } });
    await screen.findByRole("option", { name: "Sala 1 — Disponível" });
    fireEvent.change(screen.getByLabelText("Sala física"), { target: { value: "sala@resource.calendar.google.com" } });
    await waitFor(() => expect(form.getByRole("button", { name: "Confirmar Agendamento" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Término *"), { target: { value: "12:00" } });
    expect(await screen.findByRole("option", { name: "Sala 1 — Ocupada" })).toBeDisabled();
    expect(screen.getByText("Ocupado")).toBeInTheDocument();
    expect(form.getByRole("button", { name: "Confirmar Agendamento" })).toBeDisabled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(api.post).toHaveBeenLastCalledWith("/reunioes/disponibilidade", expect.objectContaining({ hora: "10:00", horaFim: "12:00", participanteIds: [2] }), expect.any(Object));
  });

  it("não consulta disponibilidade nem agenda um intervalo com término anterior ao início", async () => {
    setup(); fireEvent.click(screen.getByRole("button", { name: "Agendar" }));
    fireEvent.change(screen.getByLabelText("Início *"), { target: { value: "10:00" } });
    await screen.findByRole("option", { name: "Sala 1 — Disponível" });
    vi.mocked(api.post).mockClear();
    fireEvent.change(screen.getByLabelText("Término *"), { target: { value: "09:00" } });
    expect(screen.getByText("O término deve ser posterior ao início da reunião.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("edita reunião sem cliente e remove a sala ao mudar para virtual", async () => {
    mocks.reunioes = [{ id: 3, titulo: "Alinhamento interno", empresaId: null, dataHora: "2026-10-20T10:00:00", dataHoraFim: "2026-10-20T12:30:00", data: "2026-10-20", hora: "10:00", local: "Sala 1", presencial: false, salaEmail: "sala@resource.calendar.google.com", linkMeet: "https://meet.google.com/abc-defg-hij" }];
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }));
    fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Cliente (opcional)")).toHaveValue("");
    expect(screen.getByLabelText("Término *")).toHaveValue("12:30");
    expect(within(document.querySelector('[data-form-validation]')!).getByRole("radio", { name: "Presencial" })).toBeChecked();
    expect(screen.getByRole("link", { name: "Entrar no Google Meet" })).toHaveAttribute("href", "https://meet.google.com/abc-defg-hij");
    fireEvent.click(within(document.querySelector('[data-form-validation]')!).getByRole("radio", { name: "Virtual" }));
    fireEvent.click(within(document.querySelector('[data-form-validation]')!).getByRole("button", { name: "Confirmar Agendamento" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ id: 3, data: expect.objectContaining({ empresaId: null, presencial: false, salaEmail: null, local: "", horaFim: "12:30" }) }));
    expect(api.post).toHaveBeenCalledWith("/reunioes/disponibilidade", expect.objectContaining({ reuniaoId: 3 }), expect.any(Object));
  });

  it("move reunião da equipe no Kanban preservando a sala e os convidados", async () => {
    mocks.reunioes = [{ id: 3, titulo: "Alinhamento interno", empresaId: null, dataHora: "2026-10-20T10:00:00", data: "2026-10-20", hora: "10:00", local: "Sala 1", presencial: true, salaEmail: "sala@resource.calendar.google.com" }];
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }));
    const card = (await screen.findByText("Alinhamento interno")).closest('[draggable="true"]')!;
    fireEvent.dragStart(card);
    fireEvent.drop(screen.getByText("Confirmado").closest(".rounded-xl")!);
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ id: 3, data: expect.objectContaining({ empresaId: null, salaEmail: "sala@resource.calendar.google.com", status: "CONFIRMADA" }) }));
    expect(mocks.update.mock.calls[0][0].data).not.toHaveProperty("participanteIds");
  });
});
