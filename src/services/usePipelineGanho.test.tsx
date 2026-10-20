import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { useConcludePipelineNegocio, useMovePipelineNegocio, type PipelineResponsavelServico } from "./usePipelineVendas";

vi.mock("@/api", () => ({ api: { patch: vi.fn() } }));
const responsaveisPorServico: PipelineResponsavelServico[] = [
  { servico: "CONTABILIDADE", responsavelTecnicoId: 2 }, { servico: "CFO", responsavelTecnicoId: 3 },
];
const setup = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
};
beforeEach(() => { vi.resetAllMocks(); vi.mocked(api.patch).mockResolvedValue({ data: { success: true, data: { id: 10 } } }); });

describe("responsáveis ao ganhar uma venda", () => {
  it("envia as escolhas por serviço ao concluir pelo botão", async () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useConcludePipelineNegocio(), { wrapper });
    await act(() => result.current.mutateAsync({ id: 10, resultado: "GANHO", propostaId: 40, responsaveisPorServico }));
    expect(api.patch).toHaveBeenCalledWith("/pipeline-vendas/negocios/10/ganhar", expect.objectContaining({ propostaId: 40, responsaveisPorServico }));
    client.clear();
  });

  it("envia as escolhas por serviço ao arrastar para a etapa ganha", async () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useMovePipelineNegocio(), { wrapper });
    await act(() => result.current.mutateAsync({ id: 10, etapaId: 20, propostaId: 40, responsaveisPorServico }));
    expect(api.patch).toHaveBeenCalledWith("/pipeline-vendas/negocios/10/etapa", expect.objectContaining({ etapaId: 20, propostaId: 40, responsaveisPorServico }));
    client.clear();
  });
});
