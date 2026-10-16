import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import type { Reuniao } from "@/services/useReunioes";
import { ReunioesDiaModal } from "./ReunioesDiaModal";

vi.mock("@/api", () => ({ api: { get: vi.fn() } }));
const reuniao: Reuniao = { id: 3, titulo: "Alinhamento da equipe", dataHora: "2026-10-19T10:00:00", data: "2026-10-19", local: "Sala principal", presencial: true };
const detalhes = { ...reuniao, idReuniao: 3, dataHoraFim: "2026-10-19T11:00:00", status: "CONFIRMADA", pauta: "Revisar entregas\nDefinir responsáveis", participantes: [{ id: 1, nomeCompleto: "Ana", email: "ana@example.test" }], organizador: { id: 2, nomeCompleto: "Bruno", email: "bruno@example.test" }, linkMeet: "https://meet.google.com/abc-defg-hij" };
const setup = (reunioes = [reuniao], onClose = vi.fn()) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ReunioesDiaModal data="2026-10-19" reunioes={reunioes} onClose={onClose} /></QueryClientProvider>);

describe("consulta das reuniões do dia", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: detalhes }); });
  afterEach(cleanup);

  it("abre a lista, consulta todos os detalhes ao selecionar e permite voltar", async () => {
    setup([reuniao, { ...reuniao, id: 4, titulo: "Revisão com cliente" }]);
    const dialog = within(screen.getByRole("dialog", { name: "Reuniões em 19/10/2026" }));
    expect(dialog.getAllByRole("button", { name: /Alinhamento da equipe|Revisão com cliente/ })).toHaveLength(2);
    expect(api.get).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole("button", { name: /Alinhamento da equipe/ }));
    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/reunioes/3/detalhes");
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByText("Sala principal")).toBeInTheDocument();
    expect(screen.getByText(/Revisar entregas/)).toHaveTextContent("Definir responsáveis");
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
    expect(screen.getByText("10:00 – 11:00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar no Google Meet" })).toHaveAttribute("href", detalhes.linkMeet);
    fireEvent.click(screen.getByRole("button", { name: "Voltar à lista de reuniões" }));
    expect(screen.getByRole("dialog", { name: "Reuniões em 19/10/2026" })).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
  });

  it("mostra falha de consulta e permite tentar novamente", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Indisponível"));
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Alinhamento da equipe/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Ana")).toBeInTheDocument();
  });

  it("exibe os participantes de evento externo e não consulta um id local negativo", () => {
    setup([{ ...detalhes, id: -3, diaInteiro: true, participantesOmitidos: true, googleEventUrl: "https://calendar.google.com/event?eid=teste" }]);
    fireEvent.click(screen.getByRole("button", { name: /Alinhamento da equipe/ }));
    expect(screen.getByText("Dia inteiro")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText(/não disponibilizou a lista completa/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir no Google Agenda" })).toHaveAttribute("href", "https://calendar.google.com/event?eid=teste");
    expect(api.get).not.toHaveBeenCalled();
  });

  it("fecha com Escape e restaura a rolagem ao desmontar", () => {
    const onClose = vi.fn();
    const { unmount } = setup([reuniao], onClose);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
