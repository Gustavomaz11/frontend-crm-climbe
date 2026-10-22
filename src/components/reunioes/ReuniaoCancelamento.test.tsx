import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import type { Reuniao } from "@/services/useReunioes";
import { ReuniaoDetalhes } from "./ReuniaoDetalhes";

vi.mock("@/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const organizada: Reuniao = {
  id: 3, titulo: "Alinhamento da equipe", dataHora: "2099-10-19T10:00:00",
  dataHoraFim: "2099-10-19T11:00:00", local: "", souOrganizador: true,
  minhaResposta: "ACEITA", status: "CONFIRMADA", googleEventId: "evento",
  linkMeet: "https://meet.google.com/abc-defg-hij",
};
const setup = (reuniao = organizada) => {
  vi.mocked(api.get).mockResolvedValue({ data: reuniao });
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ReuniaoDetalhes reuniao={reuniao} />
  </QueryClientProvider>);
};

describe("cancelamento da reunião pelo criador", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("pede confirmação e atualiza os detalhes após cancelar, mantendo o histórico", async () => {
    const cancelada = { ...organizada, status: "CANCELADA", linkMeet: null };
    vi.mocked(api.post).mockImplementation(async () => {
      vi.mocked(api.get).mockResolvedValue({ data: cancelada });
      return { data: cancelada };
    });
    setup();
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar reunião" }));
    expect(screen.getByRole("group", { name: "Confirmar cancelamento da reunião" })).toHaveTextContent("O Google Agenda enviará o cancelamento aos participantes.");
    expect(api.post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));

    expect(await screen.findByText("Cancelada", { exact: true })).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledExactlyOnceWith("/reunioes/3/cancelar", undefined, expect.any(Object));
    expect(screen.queryByRole("button", { name: "Cancelar reunião" })).not.toBeInTheDocument();
    expect(screen.queryByText("Participação confirmada")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Entrar no Google Meet" })).not.toBeInTheDocument();
    expect(screen.getByText("Pauta não informada.")).toBeInTheDocument();
  });

  it("permite desistir do cancelamento sem alterar a reunião", async () => {
    setup();
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar reunião" }));
    fireEvent.click(screen.getByRole("button", { name: "Manter reunião" }));
    expect(screen.getByRole("button", { name: "Cancelar reunião" })).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByText("Confirmada", { exact: true })).toBeInTheDocument();
  });

  it.each([
    { nome: "convidado", reuniao: { ...organizada, souOrganizador: false } },
    { nome: "usuário sem permissão informada", reuniao: { ...organizada, souOrganizador: undefined } },
    { nome: "evento externo", reuniao: { ...organizada, id: -3 } },
    { nome: "reunião já cancelada", reuniao: { ...organizada, status: "CANCELADA" } },
  ])("não oferece cancelamento para $nome", async ({ reuniao }) => {
    setup(reuniao);
    await screen.findByText("Pauta não informada.");
    expect(screen.queryByRole("button", { name: "Cancelar reunião" })).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("exibe erro da API e preserva o agendamento quando o cancelamento falha", async () => {
    vi.mocked(api.post).mockRejectedValue({ isAxiosError: true, response: { status: 502, data: { message: "Não foi possível cancelar no Google Agenda. Tente novamente." } } });
    setup();
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar reunião" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível cancelar no Google Agenda. Tente novamente.");
    expect(screen.getByText("Confirmada", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar no Google Meet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar cancelamento" })).toBeEnabled();
  });

  it("bloqueia novas confirmações enquanto aguarda a API", async () => {
    let resolver!: (response: { data: Reuniao }) => void;
    vi.mocked(api.post).mockImplementation(() => new Promise(resolve => { resolver = resolve; }));
    setup();
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar reunião" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
    expect(await screen.findByRole("button", { name: "Cancelando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Manter reunião" })).toBeDisabled();
    resolver({ data: organizada });
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancelar reunião" })).toBeInTheDocument());
    expect(api.post).toHaveBeenCalledTimes(1);
  });
});
