import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, cleanup, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import Agenda from "./Agenda";

const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), reunioes: [] as object[] }));
vi.mock("@/api", () => ({ api: { get: vi.fn() } }));
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

const setup = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><Agenda /></MemoryRouter></QueryClientProvider>);

describe("reuniões da equipe na agenda", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.reunioes = [];
    vi.mocked(api.get).mockResolvedValue({ data: [{ email: "sala@resource.calendar.google.com", nome: "Sala 1" }] });
  });
  afterEach(cleanup);

  it("agenda sem cliente, com usuários e sala do Google", async () => {
    const { container } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Agendar" }));
    const formElement = container.querySelector<HTMLElement>('[data-form-validation]')!;
    const form = within(formElement);
    fireEvent.change(form.getByPlaceholderText("Pauta da reunião..."), { target: { value: "Reunião da equipe" } });
    fireEvent.change(formElement.querySelector('input[type="time"]')!, { target: { value: "10:00" } });
    fireEvent.click(form.getByRole("checkbox"));
    await screen.findByRole("option", { name: "Sala 1" });
    fireEvent.change(screen.getByLabelText("Sala no Google"), { target: { value: "sala@resource.calendar.google.com" } });
    expect(screen.getByLabelText("Cliente (opcional)")).toHaveValue("");
    fireEvent.click(form.getByRole("button", { name: "Confirmar Agendamento" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ empresaId: null, participanteIds: [2], salaEmail: "sala@resource.calendar.google.com", local: "Sala 1" })));
  });

  it("edita reunião sem cliente e remove a sala ao mudar para virtual", async () => {
    mocks.reunioes = [{ id: 3, titulo: "Alinhamento interno", empresaId: null, dataHora: "2026-10-20T10:00:00", data: "2026-10-20", hora: "10:00", local: "Sala 1", presencial: true, salaEmail: "sala@resource.calendar.google.com" }];
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }));
    fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Cliente (opcional)")).toHaveValue("");
    fireEvent.click(within(document.querySelector('[data-form-validation]')!).getByRole("radio", { name: "Virtual" }));
    fireEvent.click(within(document.querySelector('[data-form-validation]')!).getByRole("button", { name: "Confirmar Agendamento" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ id: 3, data: expect.objectContaining({ empresaId: null, presencial: false, salaEmail: null, local: "" }) }));
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
