import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { getNotificacaoDestino, useLerNotificacao, useMinhasNotificacoes } from "./useNotificacoes";
vi.mock("@/api", () => ({ api: { get: vi.fn(), patch: vi.fn() } }));
const clients: QueryClient[] = [];
afterEach(() => { clients.forEach(c => c.clear()); clients.length = 0; vi.clearAllMocks(); });
describe("notificações pessoais da equipe", () => {
  it("consulta avisos do usuário autenticado e marca como lido ao abrir", async () => {
    const notificacao = { id: 10, mensagem: "Você foi selecionado. Acesse /contratos/kanban?contrato=12 para trabalhar nas tarefas.", tipo: "CONTRATO", lida: false, dataCriacao: "2026-10-09T12:00:00", dataEnvio: "2026-10-09" };
    vi.mocked(api.get).mockResolvedValue({ data: [notificacao] });
    vi.mocked(api.patch).mockResolvedValue({ data: {} });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => ({ lista: useMinhasNotificacoes(7), ler: useLerNotificacao() }), { wrapper });
    await waitFor(() => expect(result.current.lista.data).toEqual([notificacao]));
    expect(api.get).toHaveBeenCalledWith("/notificacoes/minhas");
    expect(getNotificacaoDestino(notificacao.mensagem)).toBe("/contratos/kanban?contrato=12");
    await act(async () => { await result.current.ler.mutateAsync(10); });
    expect(api.patch).toHaveBeenCalledWith("/notificacoes/minhas/10/lida");
  });
  it("não transforma links externos ou texto arbitrário em destinos", () => {
    expect(getNotificacaoDestino("Visite https://example.test")).toBeUndefined();
    expect(getNotificacaoDestino("Contrato enviado ao cliente")).toBeUndefined();
  });
});
