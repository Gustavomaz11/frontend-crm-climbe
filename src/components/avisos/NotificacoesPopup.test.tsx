import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { api } from "@/api";
import { clearAuthCookies, saveAccessToken } from "@/lib/authCookies";
import { conectarAvisos, type AvisoSinal } from "@/services/avisosStream";
import type { Notificacao } from "@/services/useNotificacoes";
import { NotificationBell } from "@/components/NotificationBell";
import { Toaster } from "@/components/ui/sonner";
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
const popup = () => document.querySelector('[data-sonner-toast]:not([data-removed="true"])');
const esperarPopup = async (texto = "Aviso 1") => waitFor(() => expect(popup()).toHaveTextContent(texto));
const esperarFechar = async () => waitFor(() => expect(popup()).not.toBeInTheDocument());
const fechar = () => fireEvent.click(within(popup() as HTMLElement).getByRole("button", { name: "Close toast" }));
const setup = ({ bell = false, stream = false, cache }: { bell?: boolean; stream?: boolean; cache?: Notificacao[] } = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } }); clients.push(client);
  if (cache) client.setQueryData(["notificacoes", auth.usuarioId], cache);
  const content = () => <QueryClientProvider client={client}><MemoryRouter initialEntries={["/dashboard"]}>
    <Toaster />{stream ? <AvisosTempoReal /> : <NotificacoesPopup />}{bell && <NotificationBell />}<Location />
  </MemoryRouter></QueryClientProvider>;
  const view = render(content());
  return { ...view, client, refresh: () => view.rerender(content()) };
};
beforeEach(() => {
  vi.resetAllMocks(); sessionStorage.clear(); auth.usuarioId = 7; avisos = []; canais.length = 0;
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  document.cookie = "CLIMB_ACCESS_TOKEN=teste; path=/";
  vi.mocked(api.get).mockImplementation(async () => ({ data: avisos }));
  vi.mocked(api.patch).mockImplementation(async path => {
    avisos = avisos.map(item => path === `/notificacoes/minhas/${item.id}/lida` ? { ...item, lida: true } : item);
    return { data: {} };
  });
  vi.mocked(conectarAvisos).mockImplementation((signal, sinal) => {
    canais.push(sinal); return new Promise(resolve => signal.addEventListener("abort", () => resolve()));
  });
});
afterEach(async () => {
  act(() => { toast.dismiss(); });
  await act(async () => {
    if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(250);
    else await new Promise(resolve => setTimeout(resolve, 250));
  });
  cleanup(); clients.forEach(client => client.clear()); clients.length = 0;
  clearAuthCookies(); vi.useRealTimers(); vi.restoreAllMocks();
  document.querySelector("[data-teste-outro-dialogo]")?.remove();
});

describe("avisos discretos de notificações", () => {
  it.each([
    ["TAREFA_VENCIMENTO", "Atenção ao prazo da tarefa"],
    ["TAREFA_ATRASADA", "Esta tarefa está atrasada"],
  ])("reserva o popup grande para %s e mantém o aviso no sininho ao fechar", async (tipo, titulo) => {
    avisos = [aviso(1, tipo)]; setup({ bell: true });
    expect(await screen.findByRole("alertdialog", { name: titulo })).toHaveTextContent(avisos[0].mensagem);
    expect(popup()).not.toBeInTheDocument();
    expect(screen.getByLabelText("Notificações, 1 não lidas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Notificações, 1 não lidas" })).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("abre a tarefa do serviço pelo aviso grande e só marca como lido após a confirmação", async () => {
    avisos = [aviso(1, "TAREFA_ATRASADA")]; vi.mocked(api.patch).mockRejectedValueOnce(new Error("Falha")); setup();
    fireEvent.click(await screen.findByRole("button", { name: "Ver tarefa" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Tente de novo");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver tarefa" }));
    await waitFor(() => expect(screen.getByLabelText("Rota atual")).toHaveTextContent(avisos[0].destino!));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(api.patch).toHaveBeenCalledTimes(2);
  });

  it("alternar entre avisos comuns e de prazo não sobrepõe os dois tipos de popup", async () => {
    avisos = [aviso(1), aviso(2, "TAREFA_VENCIMENTO"), aviso(3, "REUNIAO_AGENDADA")]; setup();
    await esperarPopup(); fechar();
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Aviso 2");
    expect(popup()).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    await esperarPopup("Aviso 3");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("aguarda outros diálogos antes do aviso grande e o remove ao encerrar a sessão", async () => {
    const outro = document.createElement("dialog"); outro.setAttribute("open", ""); outro.dataset.testeOutroDialogo = "";
    document.body.appendChild(outro); avisos = [aviso(1, "TAREFA_VENCIMENTO")]; const { client } = setup();
    await waitFor(() => expect(client.getQueryData(["notificacoes", 7])).toEqual(avisos));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await act(async () => { outro.remove(); });
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    act(() => clearAuthCookies());
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it.each([
    ["REUNIAO_AGENDADA", "Você tem um convite para reunião", "/agenda?reuniaoId=3"],
    ["TAREFA_ATRIBUIDA", "Uma nova tarefa para você", "/contratos/kanban?contrato=12&tarefaId=34&servico=CFO"],
    ["PROPOSTA_ACEITA", "Boa notícia: proposta aceita!", "/propostas?proposta=12"],
    ["PROPOSTA_REVISAO_SOLICITADA", "O cliente pediu ajustes na proposta", "/propostas?proposta=12"],
    ["PROPOSTA_REPROVADA", "O cliente não aprovou a proposta", "/propostas?proposta=12"],
    ["CONTRATO_CRIADO", "Novo contrato para acompanhar", "/contratos?contrato=12"],
    ["CONTRATO_APROVADO", "Tudo certo: contrato aprovado!", "/contratos/kanban?contrato=12&servico=CFO"],
    ["CONTRATO_REVISAO_SOLICITADA", "O cliente pediu ajustes no contrato", "/contratos?contrato=12"],
    ["CONTRATO_REPROVADO", "O cliente não aprovou o contrato", "/contratos?contrato=12"],
  ])("mostra %s no mesmo toaster das boas-vindas e abre o destino", async (tipo, titulo, destino) => {
    avisos = [aviso(1, tipo, destino)]; setup({ bell: true }); await esperarPopup();
    expect(popup()).toHaveTextContent(titulo);
    expect(screen.getByRole("button", { name: "Notificações, 1 não lidas" })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes" }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/notificacoes/minhas/1/lida"));
    await waitFor(() => expect(screen.getByLabelText("Rota atual")).toHaveTextContent(destino)); await esperarFechar();
  });

  it.each([
    "TAREFA_CRIADA", "TAREFA_A_FAZER", "TAREFA_CONCLUIDA", "CONTRATO_ENVIADO",
    "CONTRATO_VENCIMENTO", "CONTRATO", "GERAL", "NOVO_TIPO_DE_AVISO",
  ])("mantém %s somente no aviso pequeno e no sininho, sem abrir modal", async tipo => {
    avisos = [aviso(1, tipo, null)]; setup({ bell: true }); await esperarPopup();
    expect(document.querySelectorAll('[data-sonner-toast]:not([data-removed="true"])')).toHaveLength(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe("hidden");
    expect(document.body.style.pointerEvents).not.toBe("none");
    expect(screen.getByRole("button", { name: "Notificações, 1 não lidas" })).toBeInTheDocument();
    fechar(); await esperarFechar();
    expect(screen.getByRole("button", { name: "Notificações, 1 não lidas" })).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("humaniza avisos antigos no popup e no sininho, preservando a navegação", async () => {
    avisos = [{ ...aviso(1, "CONTRATO", null), mensagem: "Você foi selecionado para a equipe fixa do contrato de Datawer Tec. Acesse /contratos/kanban?contrato=10 para trabalhar nas tarefas." }];
    setup({ bell: true }); await esperarPopup("Você agora faz parte da equipe da Datawer Tec.");
    expect(popup()).not.toHaveTextContent("/contratos/"); fechar(); await esperarFechar();
    fireEvent.click(screen.getByRole("button", { name: "Notificações, 1 não lidas" }));
    expect(screen.getByRole("alertdialog")).not.toHaveTextContent("/contratos/");
    fireEvent.click(screen.getByRole("button", { name: /Você agora faz parte da equipe/ }));
    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/contratos/kanban?contrato=10");
    await screen.findByRole("button", { name: "Notificações, 0 não lidas" });
  });

  it("recebe SSE e compartilha a consulta com o sininho sem repetir avisos", async () => {
    setup({ bell: true, stream: true }); await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    avisos = [aviso()]; act(() => canais[0]("notificacoes")); await esperarPopup(); fechar(); await esperarFechar();
    expect(screen.getByRole("button", { name: "Notificações, 1 não lidas" })).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled(); expect(api.get).toHaveBeenCalledTimes(2);
    act(() => canais[0]("sincronizar")); await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
    expect(popup()).not.toBeInTheDocument();
  });

  it("fecha automaticamente e mantém o aviso pendente no sininho", async () => {
    vi.useFakeTimers(); avisos = [aviso()]; setup({ bell: true });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); }); expect(popup()).toHaveTextContent("Aviso 1");
    await act(async () => { await vi.advanceTimersByTimeAsync(8500); });
    expect(popup()).not.toBeInTheDocument(); expect(api.patch).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Notificações, 1 não lidas" })).toBeInTheDocument();
  });

  it("enfileira só os não lidos e permite continuar usando a página", async () => {
    avisos = [aviso(3), { ...aviso(1), lida: true }, aviso(2)]; setup(); await esperarPopup("Aviso 2");
    expect(screen.getByLabelText("Rota atual")).not.toHaveAttribute("aria-hidden");
    fechar(); await esperarPopup("Aviso 3"); fechar(); await esperarFechar(); expect(api.patch).not.toHaveBeenCalled();
  });

  it("não repete avisos dispensados após remontar ou atualizar a lista", async () => {
    avisos = [aviso()]; const view = setup(); await esperarPopup(); fechar(); await esperarFechar();
    await act(async () => { await view.client.invalidateQueries({ queryKey: ["notificacoes", 7] }); });
    view.unmount(); setup(); await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3)); expect(popup()).not.toBeInTheDocument();
  });

  it("permite tentar a leitura de novo quando a API falha, sem perder o aviso", async () => {
    avisos = [aviso(1, "OUTRO_AVISO", null)]; vi.mocked(api.patch).mockRejectedValueOnce(new Error("Falha")); setup();
    fireEvent.click(await screen.findByRole("button", { name: "Marcar como lida" })); await esperarPopup("Tente de novo");
    fireEvent.click(screen.getByRole("button", { name: "Marcar como lida" })); await esperarFechar();
    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/dashboard");
  });

  it("aguarda o fechamento de outros diálogos e retoma o aviso", async () => {
    const outro = document.createElement("dialog"); outro.setAttribute("open", ""); outro.dataset.testeOutroDialogo = "";
    document.body.appendChild(outro); avisos = [aviso()]; const { client } = setup();
    await waitFor(() => expect(client.getQueryData(["notificacoes", 7])).toEqual(avisos)); expect(popup()).not.toBeInTheDocument();
    await act(async () => { outro.remove(); }); await esperarPopup();
    const tarefa = document.createElement("div"); tarefa.setAttribute("role", "dialog"); tarefa.dataset.testeOutroDialogo = "";
    await act(async () => { document.body.appendChild(tarefa); }); await esperarFechar();
    await act(async () => { tarefa.remove(); }); await esperarPopup();
  });

  it("só apresenta avisos na aba visível", async () => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true }); avisos = [aviso()]; const { client } = setup();
    await waitFor(() => expect(client.getQueryData(["notificacoes", 7])).toEqual(avisos)); expect(popup()).not.toBeInTheDocument();
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    act(() => document.dispatchEvent(new Event("visibilitychange"))); await esperarPopup();
  });

  it("confere o servidor antes de mostrar pendências antigas do cache", async () => {
    let finish: (value: unknown) => void = () => {};
    vi.mocked(api.get).mockImplementation(() => new Promise(resolve => { finish = resolve; })); setup({ cache: [aviso()] });
    expect(popup()).not.toBeInTheDocument(); await act(async () => { finish({ data: [] }); }); expect(popup()).not.toBeInTheDocument();
  });

  it("fecha no logout e não consulta dados sem autenticação", async () => {
    clearAuthCookies(); avisos = [aviso()]; setup(); expect(api.get).not.toHaveBeenCalled();
    act(() => saveAccessToken("teste", 60_000)); await esperarPopup(); act(() => clearAuthCookies()); await esperarFechar();
  });

  it("descarta a ação pendente ao trocar a sessão", async () => {
    let finish: (value: unknown) => void = () => {};
    vi.mocked(api.patch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    avisos = [aviso()]; const view = setup(); fireEvent.click(await screen.findByRole("button", { name: "Ver detalhes" }));
    act(() => clearAuthCookies()); auth.usuarioId = 8; avisos = []; view.refresh();
    await act(async () => { finish({ data: {} }); }); await esperarFechar();
    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/dashboard");
  });

  it("conclui a abertura solicitada mesmo se outro diálogo aparecer durante a requisição", async () => {
    let finish: (value: unknown) => void = () => {};
    vi.mocked(api.patch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    avisos = [aviso()]; setup(); fireEvent.click(await screen.findByRole("button", { name: "Ver detalhes" }));
    const outro = document.createElement("dialog"); outro.setAttribute("open", ""); outro.dataset.testeOutroDialogo = "";
    await act(async () => { document.body.appendChild(outro); }); await esperarFechar();
    await act(async () => { finish({ data: {} }); });
    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/contratos/kanban?contrato=12&tarefaId=34&servico=CFO");
  });

  it("deduplica em memória quando sessionStorage está bloqueado", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Bloqueado"); });
    avisos = [aviso()]; const { client } = setup(); await esperarPopup(); fechar(); await esperarFechar();
    await act(async () => { await client.invalidateQueries({ queryKey: ["notificacoes", 7] }); }); expect(popup()).not.toBeInTheDocument();
  });
});
