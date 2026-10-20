import { fetchEventSource, EventStreamContentType } from "@microsoft/fetch-event-source";
import { isAxiosError } from "axios";
import { api } from "@/api";

export type AvisoSinal = "notificacoes" | "convites" | "kanban" | "sincronizar";

// Usa os mesmos interceptadores de JWT e renovação de sessão das demais chamadas.
const fetchAutenticado: typeof fetch = async (_input, init) => {
  const response = await api.get<ReadableStream<Uint8Array>>("/avisos/stream", {
    adapter: "fetch",
    responseType: "stream",
    signal: init?.signal ?? undefined,
    headers: { Accept: EventStreamContentType, "Content-Type": false },
  });
  return new Response(response.data, {
    status: response.status,
    headers: { "Content-Type": String(response.headers["content-type"] ?? "") },
  });
};

export const conectarAvisos = (signal: AbortSignal, onSinal: (sinal: AvisoSinal) => void) => {
  if (signal.aborted) return Promise.resolve();
  let tentativas = 0;
  return fetchEventSource("/avisos/stream", {
    signal,
    fetch: fetchAutenticado,
    openWhenHidden: true, // O ciclo da aba é controlado pelo hook, inclusive durante tentativas de reconexão.
    async onopen(response) {
      if (!response.ok || !response.headers.get("content-type")?.startsWith(EventStreamContentType)) {
        throw new Error("O canal de avisos não está disponível.");
      }
      tentativas = 0;
    },
    onmessage(message) {
      if (message.event === "notificacoes" || message.event === "convites" || message.event === "kanban" || message.event === "sincronizar") {
        onSinal(message.event);
      }
    },
    onclose() { throw new Error("Reconectando o canal de avisos."); },
    onerror(error) {
      // A API já tentou renovar a sessão. Uma recusa definitiva não deve criar um ciclo de autenticação.
      if (isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) throw error;
      return Math.min(30_000, 1_000 * 2 ** Math.min(tentativas++, 5)) + Math.floor(Math.random() * 500);
    },
  });
};
