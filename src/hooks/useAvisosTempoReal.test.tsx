import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { conectarAvisos, type AvisoSinal } from "@/services/avisosStream";
import { useMinhasNotificacoes } from "@/services/useNotificacoes";
import { useConvitesReuniaoPendentes, useReunioes, useReuniaoDetalhes } from "@/services/useReunioes";
import { useAvisosTempoReal } from "./useAvisosTempoReal";
import { clearAuthCookies, saveAccessToken } from "@/lib/authCookies";

vi.mock("@/api", () => ({ api: { get: vi.fn() } }));
vi.mock("@/services/avisosStream", () => ({ conectarAvisos: vi.fn() }));
const canais: { signal: AbortSignal; sinal: (tipo: AvisoSinal) => void }[] = [];
const clients: QueryClient[] = [];
const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } }); clients.push(client);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
};
beforeEach(() => {
  vi.clearAllMocks(); canais.length = 0;
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  document.cookie = "CLIMB_ACCESS_TOKEN=teste; path=/";
  vi.mocked(api.get).mockResolvedValue({ data: [] });
  vi.mocked(conectarAvisos).mockImplementation((signal, sinal) => {
    canais.push({ signal, sinal });
    return new Promise(resolve => signal.addEventListener("abort", () => resolve()));
  });
});
afterEach(() => {
  cleanup(); clients.forEach(client => client.clear()); clients.length = 0;
  vi.useRealTimers(); document.cookie = "CLIMB_ACCESS_TOKEN=; Max-Age=0; path=/";
});

describe("canal global de avisos", () => {
  it("atualiza o status dos participantes no detalhe aberto quando chega uma resposta pelo SSE", async () => {
    const { wrapper } = setup();
    const reuniao = { idReuniao: 3, titulo: "Reunião", data: "2099-10-20", hora: "10:00", participantes: [{ email: "ana@climbe.com.br", resposta: "PENDENTE" }] };
    vi.mocked(api.get).mockResolvedValue({ data: reuniao });
    const { result } = renderHook(() => { useAvisosTempoReal(7); return useReuniaoDetalhes(3); }, { wrapper });
    await waitFor(() => expect(result.current.data?.participantes?.[0].resposta).toBe("PENDENTE"));
    vi.mocked(api.get).mockResolvedValue({ data: { ...reuniao, participantes: [{ email: "ana@climbe.com.br", resposta: "ACEITA" }] } });
    act(() => canais[0].sinal("convites"));
    await waitFor(() => expect(result.current.data?.participantes?.[0].resposta).toBe("ACEITA"));
    expect(api.get).toHaveBeenCalledTimes(2);
  });
  it("carrega os pendentes ao entrar e não consulta periodicamente", async () => {
    const { wrapper } = setup();
    renderHook(() => {
      useAvisosTempoReal(7);
      return { avisos: useMinhasNotificacoes(7), convites: useConvitesReuniaoPendentes(7) };
    }, { wrapper });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(conectarAvisos).toHaveBeenCalledTimes(1);
    vi.useFakeTimers();
    await act(async () => { await vi.advanceTimersByTimeAsync(65_000); });
    expect(api.get).toHaveBeenCalledTimes(2);
    await act(async () => { canais[0].sinal("sincronizar"); await vi.advanceTimersByTimeAsync(100); });
    expect(api.get).toHaveBeenCalledTimes(4);
  });

  it("agrupa eventos em lote e invalida somente os dados do usuário conectado", async () => {
    const { client, wrapper } = setup(); const invalidar = vi.spyOn(client, "invalidateQueries");
    renderHook(() => useAvisosTempoReal(7), { wrapper });
    vi.useFakeTimers();
    await act(async () => {
      for (let i = 0; i < 20; i++) canais[0].sinal("notificacoes");
      canais[0].sinal("convites"); await vi.advanceTimersByTimeAsync(100);
    });
    expect(invalidar).toHaveBeenCalledTimes(2);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["notificacoes", 7] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["reunioes"] });
  });

  it("atualiza a agenda aberta ao receber convite para permitir abrir os detalhes pelo aviso", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => { useAvisosTempoReal(7); return useReunioes(); }, { wrapper });
    await waitFor(() => expect(result.current.data).toEqual([]));
    vi.mocked(api.get).mockResolvedValue({ data: [{ idReuniao: 3, titulo: "Nova reunião", data: "2099-10-20", hora: "10:00", local: "Sala 1" }] });
    act(() => canais[0].sinal("convites"));
    await waitFor(() => expect(result.current.data?.[0]).toMatchObject({ id: 3, titulo: "Nova reunião" }));
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("fecha ao ocultar a aba e sincroniza pelo novo canal ao voltar", async () => {
    const { client, wrapper } = setup(); const invalidar = vi.spyOn(client, "invalidateQueries");
    const { unmount } = renderHook(() => useAvisosTempoReal(7), { wrapper });
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(canais[0].signal.aborted).toBe(true);
    expect(conectarAvisos).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(conectarAvisos).toHaveBeenCalledTimes(2);
    vi.useFakeTimers();
    await act(async () => { canais[1].sinal("sincronizar"); await vi.advanceTimersByTimeAsync(100); });
    expect(invalidar).toHaveBeenCalledTimes(4);
    act(() => { window.dispatchEvent(new Event("offline")); });
    expect(canais[1].signal.aborted).toBe(true);
    act(() => { window.dispatchEvent(new Event("online")); });
    expect(conectarAvisos).toHaveBeenCalledTimes(3);
    unmount(); expect(canais[2].signal.aborted).toBe(true);
  });

  it("cancela eventos pendentes da sessão anterior ao trocar de usuário", async () => {
    const { client, wrapper } = setup(); const invalidar = vi.spyOn(client, "invalidateQueries");
    const { rerender } = renderHook(({ usuarioId }) => useAvisosTempoReal(usuarioId), { wrapper, initialProps: { usuarioId: 7 } });
    vi.useFakeTimers(); act(() => canais[0].sinal("notificacoes"));
    rerender({ usuarioId: 8 }); expect(canais[0].signal.aborted).toBe(true);
    await act(async () => { canais[0].sinal("convites"); canais[1].sinal("notificacoes"); await vi.advanceTimersByTimeAsync(100); });
    expect(invalidar).toHaveBeenCalledTimes(1);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["notificacoes", 8] });
  });

  it("atualiza lista e acesso ao Kanban após atribuição ou encerramento", async () => {
    const { client, wrapper } = setup(); const invalidar = vi.spyOn(client, "invalidateQueries");
    renderHook(() => useAvisosTempoReal(7), { wrapper });
    vi.useFakeTimers();
    await act(async () => { canais[0].sinal("kanban"); await vi.advanceTimersByTimeAsync(100); });
    expect(invalidar).toHaveBeenCalledTimes(2);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["contratos", "kanban-resumos", 7] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["contratos", "kanban-acesso", 7] });
  });

  it("não abre conexão sem uma sessão ou sem usuário", () => {
    const { wrapper } = setup();
    document.cookie = "CLIMB_ACCESS_TOKEN=; Max-Age=0; path=/";
    renderHook(() => useAvisosTempoReal(7), { wrapper });
    renderHook(() => useAvisosTempoReal(), { wrapper });
    expect(conectarAvisos).not.toHaveBeenCalled();
  });

  it("abre ao receber a sessão e troca o token sem precisar trocar o ID do usuário", () => {
    const { wrapper } = setup(); clearAuthCookies();
    renderHook(() => useAvisosTempoReal(7), { wrapper });
    expect(conectarAvisos).not.toHaveBeenCalled();
    act(() => saveAccessToken("primeiro-token", 60_000));
    expect(conectarAvisos).toHaveBeenCalledTimes(1);
    act(() => saveAccessToken("token-renovado", 60_000));
    expect(canais[0].signal.aborted).toBe(true);
    expect(conectarAvisos).toHaveBeenCalledTimes(2);
    act(() => clearAuthCookies());
    expect(canais[1].signal.aborted).toBe(true);
    expect(conectarAvisos).toHaveBeenCalledTimes(2);
  });
});
