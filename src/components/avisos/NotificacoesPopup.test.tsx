import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { clearAuthCookies, saveAccessToken } from "@/lib/authCookies";
import { conectarAvisos, type AvisoSinal } from "@/services/avisosStream";
import type { Notificacao } from "@/services/useNotificacoes";
import { NotificationBell } from "@/components/NotificationBell";
import { AvisosTempoReal } from "./AvisosTempoReal";
import { NotificacoesPopup } from "./NotificacoesPopup";

vi.mock("@/api", () => ({ api: { get: vi.fn(), patch: vi.fn() } }));
vi.mock("@/services/avisosStream", () => ({ conectarAvisos: vi.fn() }));
const auth = vi.hoisted(() => ({ usuarioId: 7 as number | undefined }));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (state: object) => unknown) => selector({ basicUserData: { id: auth.usuarioId } }) }));
let avisos: Notificacao[] = [];
const clients: QueryClient[] = [];
const canais: ((sinal: AvisoSinal) => void)[] = [];
const aviso = (id = 1, tipo = "TAREFA_ATRIBUIDA", destino: string | null = "/contratos/kanban?contrato=12&tarefaId=34&servico=CFO"): Notificacao => ({
  id, tipo, destino, mensagem: `Aviso ${id} para a pessoa responsável`, lida: false,
  dataCriacao: "2026-10-20T12:00:00", dataEnvio: "2026-10-20",
});
const Location = () => { const location = useLocation(); return <output aria-label="Rota atual">{location.pathname}{location.search}</output>; };
const setup = ({ bell = false, stream = false, cache }: { bell?: boolean; stream?: boolean; cache?: Notificacao[] } = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } }); clients.push(client);
  if (cache) client.setQueryData(["notificacoes", auth.usuarioId], cache);
  const content = () => <QueryClientProvider client={client}><MemoryRouter initialEntries={["/dashboard"]}>
    {stream ? <AvisosTempoReal /> : <NotificacoesPopup />}{bell && <NotificationBell />}<Location />
  </MemoryRouter></QueryClientProvider>;
  const view = render(content());
  return { ...view, client, refresh: () => view.rerender(content()) };
};
beforeEach(() => {
  vi.resetAllMocks(); sessionStorage.clear(); auth.usuarioId = 7; avisos = []; canais.length = 0;
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  document.cookie = "CLIMB_ACCESS_TOKEN=teste; path=/";
  vi.mocked(api.get).mockImplementation(async () => ({ data: avisos }));
  vi.mocked(api.patch).mockImplementation(async () => { avisos = avisos.map(item => ({ ...item, lida: true })); return { data: {} }; });
  vi.mocked(conectarAvisos).mockImplementation((signal, sinal) => {
    canais.push(sinal); return new Promise(resolve => signal.addEventListener("abort", () => resolve()));
  });
});
afterEach(() => {
  cleanup(); clients.forEach(client => client.clear()); clients.length = 0; clearAuthCookies(); vi.restoreAllMocks();
  document.querySelector("[data-teste-outro-dialogo]")?.remove();
});

describe("popup global de notificações", () => {
  it.each([
    ["TAREFA_ATRIBUIDA", "Tarefa atribuída a você", "/contratos/kanban?contrato=12&tarefaId=34&servico=CFO"],
    ["PROPOSTA_ACEITA", "Proposta aceita", "/propostas?proposta=12"],
    ["PROPOSTA_REVISAO_SOLICITADA", "Cliente solicitou revisão da proposta", "/propostas?proposta=12"],
    ["PROPOSTA_REPROVADA", "Proposta reprovada pelo cliente", "/propostas?proposta=12"],
    ["CONTRATO_CRIADO", "Novo contrato", "/contratos?contrato=12"],
    ["CONTRATO_APROVADO", "Contrato aprovado", "/contratos/kanban?contrato=12&servico=CFO"],
    ["CONTRATO_REVISAO_SOLICITADA", "Cliente solicitou revisão do contrato", "/contratos?contrato=12"],
    ["CONTRATO_REPROVADO", "Contrato reprovado pelo cliente", "/contratos?contrato=12"],
  ])("mostra %s e abre o destino marcando o aviso como lido", async (tipo, titulo, destino) => {
    avisos = [aviso(1, tipo, destino)]; setup();
    expect(await screen.findByRole("alertdialog", { name: titulo })).toHaveTextContent(avisos[0].mensagem);
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes" }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/notificacoes/minhas/1/lida"));
    await waitFor(() => expect(screen.getByLabelText("Rota atual")).toHaveTextContent(destino));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("recebe o sinal SSE e compartilha a mesma consulta com o sininho", async () => {
    setup({ bell: true, stream: true });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    avisos = [aviso()]; act(() => canais[0]("notificacoes"));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    expect(screen.getByRole("button", { name: "Notificações, 1 não lidas" })).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled(); expect(api.get).toHaveBeenCalledTimes(2);
    act(() => canais[0]("sincronizar"));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("enfileira os avisos não lidos, sem sobrepor popups nem alterar a leitura ao fechar", async () => {
    avisos = [aviso(3), { ...aviso(1), lida: true }, aviso(2)]; setup();
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Aviso 2");
    expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Fechar notificação" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Aviso 3");
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(); expect(api.patch).not.toHaveBeenCalled();
  });

  it("não repete avisos dispensados após remontar ou atualizar a lista", async () => {
    avisos = [aviso()]; const view = setup();
    fireEvent.click(await screen.findByRole("button", { name: "Agora não" }));
    await act(async () => { await view.client.invalidateQueries({ queryKey: ["notificacoes", 7] }); });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    view.unmount(); setup(); await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("permite marcar como lido um aviso sem link e mantém o popup quando a API falha", async () => {
    avisos = [aviso(1, "OUTRO_AVISO", null)]; vi.mocked(api.patch).mockRejectedValueOnce(new Error("Falha")); setup();
    fireEvent.click(await screen.findByRole("button", { name: "Marcar como lida" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Tente novamente");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Marcar como lida" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/dashboard");
  });

  it("aguarda convites ou outros diálogos e retoma a fila após fechá-los", async () => {
    const outro = document.createElement("dialog"); outro.setAttribute("open", ""); outro.dataset.testeOutroDialogo = "";
    document.body.appendChild(outro); avisos = [aviso()]; const { client } = setup();
    await waitFor(() => expect(client.getQueryData(["notificacoes", 7])).toEqual(avisos));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await act(async () => { outro.remove(); }); expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    const tarefa = document.createElement("div"); tarefa.setAttribute("role", "dialog"); tarefa.dataset.testeOutroDialogo = "";
    await act(async () => { document.body.appendChild(tarefa); });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await act(async () => { tarefa.remove(); }); expect(await screen.findByRole("alertdialog")).toHaveTextContent("Aviso 1");
  });

  it("só apresenta popups na aba visível", async () => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true }); avisos = [aviso()]; const { client } = setup();
    await waitFor(() => expect(client.getQueryData(["notificacoes", 7])).toEqual(avisos));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
  });

  it("não usa avisos antigos do cache antes de conferir o estado atual no servidor", async () => {
    let finish: (value: unknown) => void = () => {};
    vi.mocked(api.get).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    setup({ cache: [aviso()] });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await act(async () => { finish({ data: [] }); });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("fecha imediatamente no logout e não consulta dados sem autenticação", async () => {
    clearAuthCookies(); avisos = [aviso()]; setup(); expect(api.get).not.toHaveBeenCalled();
    act(() => saveAccessToken("teste", 60_000)); expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    act(() => clearAuthCookies()); expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("descarta a ação pendente ao trocar a sessão, sem navegar para o aviso anterior", async () => {
    let finish: (value: unknown) => void = () => {};
    vi.mocked(api.patch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    avisos = [aviso()]; const view = setup(); fireEvent.click(await screen.findByRole("button", { name: "Ver detalhes" }));
    act(() => clearAuthCookies()); auth.usuarioId = 8; avisos = []; view.refresh();
    await act(async () => { finish({ data: {} }); });
    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/dashboard");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("conclui a abertura solicitada mesmo se outro diálogo aparecer durante a requisição", async () => {
    let finish: (value: unknown) => void = () => {};
    vi.mocked(api.patch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    avisos = [aviso()]; setup(); fireEvent.click(await screen.findByRole("button", { name: "Ver detalhes" }));
    const outro = document.createElement("dialog"); outro.setAttribute("open", ""); outro.dataset.testeOutroDialogo = "";
    await act(async () => { document.body.appendChild(outro); });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await act(async () => { finish({ data: {} }); });
    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/contratos/kanban?contrato=12&tarefaId=34&servico=CFO");
  });

  it("continua deduplicando em memória quando sessionStorage está bloqueado", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Bloqueado"); });
    avisos = [aviso()]; const { client } = setup(); fireEvent.click(await screen.findByRole("button", { name: "Agora não" }));
    await act(async () => { await client.invalidateQueries({ queryKey: ["notificacoes", 7] }); });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
