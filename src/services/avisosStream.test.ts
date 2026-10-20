import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { api } from "@/api";
import { conectarAvisos } from "./avisosStream";

vi.mock("@/api", () => ({ api: { get: vi.fn() } }));
const abertos: AbortController[] = [];
const abrir = () => { const controller = new AbortController(); abertos.push(controller); return controller; };
const streams: ReadableStreamDefaultController<Uint8Array>[] = [];
beforeEach(() => {
  vi.clearAllMocks(); streams.length = 0;
  vi.spyOn(Math, "random").mockReturnValue(0);
  vi.mocked(api.get).mockImplementation(async (_url, config) => ({
    status: 200, headers: { "content-type": "text/event-stream;charset=UTF-8" },
    data: new ReadableStream<Uint8Array>({ start(controller) {
      streams.push(controller);
      config?.signal?.addEventListener?.("abort", () => { try { controller.close(); } catch { /* Já fechado. */ } });
    } }),
  }));
});
afterEach(() => { abertos.forEach(controller => controller.abort()); abertos.length = 0; vi.useRealTimers(); vi.restoreAllMocks(); });

describe("transporte SSE autenticado", () => {
  it("processa eventos fragmentados e ignora mensagens de manutenção", async () => {
    const controller = abrir(); const sinal = vi.fn(); const fim = conectarAvisos(controller.signal, sinal);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    for (const chunk of ["event:sinc", "ronizar\r\ndata:{}\r\n\r\nevent:heartbeat\ndata:{}\n\n", "event:convites\ndata:{}\n\nevent:notificacoes\ndata:{}\n\n"]) {
      streams[0].enqueue(new TextEncoder().encode(chunk));
    }
    streams[0].enqueue(new TextEncoder().encode("event:kanban\ndata:{}\n\n"));
    await waitFor(() => expect(sinal.mock.calls).toEqual([["sincronizar"], ["convites"], ["notificacoes"], ["kanban"]]));
    expect(api.get).toHaveBeenCalledWith("/avisos/stream", expect.objectContaining({
      adapter: "fetch", responseType: "stream", headers: { Accept: "text/event-stream", "Content-Type": false },
    }));
    controller.abort(); await fim;
  });

  it("reconecta quando o servidor fecha a conexão", async () => {
    const controller = abrir(); const fim = conectarAvisos(controller.signal, vi.fn());
    await waitFor(() => expect(streams).toHaveLength(1));
    vi.useFakeTimers(); streams[0].close();
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.get).toHaveBeenCalledTimes(2);
    controller.abort(); await fim;
  });

  it("não repete indefinidamente uma sessão recusada após a renovação", async () => {
    const recusado = Object.assign(new Error("Sessão encerrada"), { isAxiosError: true, response: { status: 401 } });
    vi.mocked(api.get).mockRejectedValue(recusado);
    const controller = abrir();
    await expect(conectarAvisos(controller.signal, vi.fn())).rejects.toBe(recusado);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("não inicia chamadas de uma conexão que já foi cancelada", async () => {
    const controller = abrir(); controller.abort();
    await conectarAvisos(controller.signal, vi.fn());
    expect(api.get).not.toHaveBeenCalled();
  });
});
