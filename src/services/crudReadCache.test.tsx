import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { useContratos } from "./useContratos";
import { useDocumentos } from "./useDocumentos";
import { usePropostas } from "./usePropostas";

vi.mock("@/api", () => ({ api: { get: vi.fn() } }));

describe("revogação da leitura", () => {
  it.each([
    { name: "contratos", key: ["contratos"], useData: () => useContratos(false) },
    { name: "documentos", key: ["documentos"], useData: () => useDocumentos(false) },
    { name: "propostas", key: ["propostas", null, null], useData: () => usePropostas({}, false) },
  ])("oculta $name em cache e não consulta a API quando a leitura está desabilitada", ({ key, useData }) => {
    const client = new QueryClient();
    client.setQueryData(key, [{ id: 1, descricao: "Dado armazenado anteriormente" }]);
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useData().data, { wrapper });
    expect(result.current).toBeUndefined();
    expect(api.get).not.toHaveBeenCalled();
    client.clear();
  });
});
