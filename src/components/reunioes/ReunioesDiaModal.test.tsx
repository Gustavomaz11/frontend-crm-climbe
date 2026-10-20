import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import type { Reuniao } from "@/services/useReunioes";
import { ReunioesDiaModal } from "./ReunioesDiaModal";

vi.mock("@/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
const reuniao: Reuniao = { id: 3, titulo: "Alinhamento da equipe", dataHora: "2026-10-19T10:00:00", data: "2026-10-19", local: "Sala principal", presencial: true };
const detalhes = { ...reuniao, idReuniao: 3, dataHoraFim: "2026-10-19T11:00:00", status: "CONFIRMADA", pauta: "Revisar entregas\nDefinir responsáveis", participantes: [{ id: 1, nomeCompleto: "Ana", email: "ana@example.test" }], organizador: { id: 2, nomeCompleto: "Bruno", email: "bruno@example.test" }, linkMeet: "https://meet.google.com/abc-defg-hij" };
const setup = (reunioes = [reuniao], onClose = vi.fn()) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ReunioesDiaModal data="2026-10-19" reunioes={reunioes} onClose={onClose} /></QueryClientProvider>);

describe("consulta das reuniões do dia", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: detalhes }); });
  afterEach(cleanup);

  it("mostra aceite em verde, recusa em vermelho e confirma automaticamente o organizador", () => {
    setup([{ ...detalhes, id: -3, participantes: [
      { email: "bruno@example.test", resposta: "PENDENTE" },
      { email: "ana@example.test", resposta: "ACEITA" },
      { email: "bia@example.test", resposta: "RECUSADA" },
      { email: "caio@example.test", resposta: "PENDENTE" },
      { email: "davi@example.test", resposta: "TENTATIVA" },
    ] }]);
    fireEvent.click(screen.getByRole("button", { name: /Alinhamento da equipe/ }));
    const pessoas = within(screen.getByRole("region", { name: "Participantes da reunião" }));
    expect(pessoas.getByText("bruno@example.test").closest("li")).toHaveClass("border-emerald-500/70");
    expect(pessoas.getByText("Aceitou · Organizador")).toBeInTheDocument();
    const aceitou = pessoas.getByText("ana@example.test").closest("li")!;
    expect(aceitou).toHaveClass("border-emerald-500/70");
    expect(within(aceitou).getByText("Aceitou")).toBeInTheDocument();
    const recusou = pessoas.getByText("bia@example.test").closest("li")!;
    expect(recusou).toHaveClass("border-red-500/70");
    expect(within(recusou).getByText("Recusou")).toBeInTheDocument();
    expect(pessoas.getByText("Aguardando resposta")).toBeInTheDocument();
    expect(pessoas.getByText("Talvez")).toBeInTheDocument();
  });

  it("permite rejeitar o convite e mostra a recusa nos detalhes", async () => {
    const pendente: Reuniao = { ...detalhes, data: "2099-10-19", dataHora: "2099-10-19T10:00:00", dataHoraFim: "2099-10-19T11:00:00", minhaResposta: "PENDENTE" };
    vi.mocked(api.get).mockResolvedValue({ data: pendente });
    vi.mocked(api.post).mockImplementation(async () => {
      const recusado = { ...pendente, minhaResposta: "RECUSADA", participantes: [{ ...pendente.participantes![0], resposta: "RECUSADA" }] };
      vi.mocked(api.get).mockResolvedValue({ data: recusado });
      return { data: recusado };
    });
    setup([pendente]); fireEvent.click(screen.getByRole("button", { name: /Alinhamento da equipe/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Rejeitar reunião" }));
    expect(await screen.findByText("Você recusou esta reunião")).toBeInTheDocument();
    expect(await screen.findByText("Recusou")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/reunioes/3/rejeitar");
    expect(screen.queryByRole("button", { name: "Rejeitar reunião" })).not.toBeInTheDocument();
  });

  it("organizador já confirmado não recebe botões para responder à própria reunião", async () => {
    const organizada: Reuniao = { ...detalhes, dataHoraFim: "2099-10-19T11:00:00", minhaResposta: "ACEITA", souOrganizador: true };
    vi.mocked(api.get).mockResolvedValue({ data: organizada });
    setup([organizada]); fireEvent.click(screen.getByRole("button", { name: /Alinhamento da equipe/ }));
    expect(await screen.findByText("Participação confirmada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aceitar reunião" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rejeitar reunião" })).not.toBeInTheDocument();
  });

  it("permite ao convidado aceitar pelos detalhes e exibe a confirmação", async () => {
    const pendente: Reuniao = { ...detalhes, data: "2099-10-19", dataHora: "2099-10-19T10:00:00", dataHoraFim: "2099-10-19T11:00:00", minhaResposta: "PENDENTE" };
    vi.mocked(api.get).mockResolvedValue({ data: pendente });
    vi.mocked(api.post).mockImplementation(async () => {
      const aceito = { ...pendente, minhaResposta: "ACEITA" };
      vi.mocked(api.get).mockResolvedValue({ data: aceito });
      return { data: aceito };
    });
    setup([pendente]); fireEvent.click(screen.getByRole("button", { name: /Alinhamento da equipe/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Aceitar reunião" }));
    expect(await screen.findByText("Participação confirmada")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/reunioes/3/aceitar");
    expect(screen.queryByRole("button", { name: "Aceitar reunião" })).not.toBeInTheDocument();
  });

  it("classifica reunião com local como presencial na lista e nos detalhes mantendo o Meet", () => {
    setup([{ ...detalhes, id: -3, presencial: false }]);
    expect(screen.getByRole("button", { name: /Alinhamento da equipe/ })).toHaveTextContent("Presencial");
    fireEvent.click(screen.getByRole("button", { name: /Alinhamento da equipe/ }));
    expect(screen.getByText("Presencial", { exact: true })).toBeInTheDocument();
    expect(screen.queryByText("Virtual", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar no Google Meet" })).toHaveAttribute("href", detalhes.linkMeet);
  });

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

  it("mantém o diálogo durante a saída e restaura o foco e a rolagem ao fechar com Escape", async () => {
    const onClose = vi.fn();
    render(<button>Abrir reuniões</button>);
    const trigger = screen.getByRole("button", { name: "Abrir reuniões" });
    trigger.focus();
    const { unmount } = setup([reuniao], onClose);
    screen.getByRole("button", { name: "Fechar reuniões do dia" }).focus();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(document.body.style.overflow).toBe("hidden");
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    unmount();
    expect(document.body.style.overflow).toBe("");
    expect(trigger).toHaveFocus();
  });
});
