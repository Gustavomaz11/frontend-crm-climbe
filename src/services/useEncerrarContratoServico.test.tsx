import { act, renderHook, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import type { ContratoKanbanResumo } from "./useContratos";
import { useEncerrarContratoServico } from "./useEncerrarContratoServico";

vi.mock("@/api", () => ({ api: { patch: vi.fn() } }));
const clients: QueryClient[] = [];
const setup = (servicos: ContratoKanbanResumo["servicos"] = [{ servico: "CONTABILIDADE" }, { servico: "CFO" }]) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); clients.push(client);
  client.setQueryData<ContratoKanbanResumo[]>(["contratos", "kanban-resumos", 7], [
    { id: 10, empresaNome: "Datawer Tec", titulo: "Contrato", status: "APROVADO", equipeConfigurada: true, servicos },
  ]);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
};
beforeEach(() => { vi.resetAllMocks(); vi.mocked(api.patch).mockResolvedValue({ data: {} }); });
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); clients.length = 0; });

describe("encerramento por serviço", () => {
  it("retira apenas o serviço encerrado e atualiza a permissão do menu", async () => {
    const { client, wrapper } = setup(); const invalidar = vi.spyOn(client, "invalidateQueries");
    client.setQueryData(["contratos", 11, "kanban"], { titulo: "Outro contrato" });
    const { result } = renderHook(useEncerrarContratoServico, { wrapper });
    await act(async () => result.current.mutateAsync({ contratoId: 10, servico: "CFO" }));
    expect(api.patch).toHaveBeenCalledWith("/contratos/10/kanban/encerrar", { servico: "CFO" });
    expect(client.getQueryData<ContratoKanbanResumo[]>(["contratos", "kanban-resumos", 7])?.[0].servicos).toEqual([{ servico: "CONTABILIDADE" }]);
    expect(client.getQueryData(["contratos", 11, "kanban"])).toEqual({ titulo: "Outro contrato" });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["contratos", "kanban-acesso"] });
  });

  it("remove o menu do contrato quando o último serviço é encerrado", async () => {
    const { client, wrapper } = setup([{ servico: "CFO" }]);
    const { result } = renderHook(useEncerrarContratoServico, { wrapper });
    await act(async () => result.current.mutateAsync({ contratoId: 10, servico: "CFO" }));
    expect(client.getQueryData(["contratos", "kanban-resumos", 7])).toEqual([]);
  });

  it("mantém o quadro quando a API recusa o encerramento", async () => {
    const { client, wrapper } = setup(); const antes = client.getQueryData(["contratos", "kanban-resumos", 7]);
    vi.mocked(api.patch).mockRejectedValue(Object.assign(new Error(), { isAxiosError: true, response: { status: 403, data: { detail: "Somente o responsável pode encerrar." } } }));
    const { result } = renderHook(useEncerrarContratoServico, { wrapper });
    act(() => result.current.mutate({ contratoId: 10, servico: "CFO" }));
    await waitFor(() => expect(result.current.error?.message).toBe("Somente o responsável pode encerrar."));
    expect(client.getQueryData(["contratos", "kanban-resumos", 7])).toEqual(antes);
  });
});
