import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { IntegracaoAuditoriaPanel } from "./IntegracaoAuditoriaPanel";

vi.mock("@/api", () => ({ api: { get: vi.fn() } }));
const eventos = [
  { id: 1, evento: "REQUISICAO", metodo: "POST", rota: "/api/integracoes/v1/comercial/pre-vendas/leads", status: 201, criadoEm: "2026-10-22T19:32:48Z", payloadDisponivel: true },
  { id: 2, evento: "REQUISICAO", metodo: "POST", rota: "/api/integracoes/v1/comercial/pre-vendas/leads", status: 415, criadoEm: "2026-10-22T19:31:27Z", payloadDisponivel: false },
  { id: 3, evento: "REQUISICAO", metodo: "POST", rota: "/api/integracoes/v1/comercial/pre-vendas/leads", status: 201, criadoEm: "2026-10-21T19:32:48Z", payloadDisponivel: false },
  { id: 4, evento: "REQUISICAO", metodo: "POST", rota: "/api/integracoes/v1/comercial/pre-vendas/leads", status: 201, criadoEm: "2026-10-20T19:32:48Z", payloadDisponivel: false, payloadLimiteExcedido: true },
];
const renderPanel = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
  <IntegracaoAuditoriaPanel id="integracao-1" nome="Empresa Teste" onFechar={vi.fn()} />
</QueryClientProvider>);

describe("histórico de payloads de integração", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("carrega o JSON somente ao abrir e mantém eventos antigos e falhas sem botão", async () => {
    vi.mocked(api.get).mockImplementation(async url => ({ data: url === "/integracoes/integracao-1/auditoria" ? eventos : { payload: '{"nomeContato":"Melyssa Tatum","responsavelId":0,"client_secret":"[OCULTO]","observacoes":"<script>exemplo</script>"}' } }));
    renderPanel();
    const abrir = await screen.findByRole("button", { name: "Ver payload" });
    expect(screen.getAllByRole("button", { name: "Ver payload" })).toHaveLength(1);
    expect(screen.getByText("Não registrado")).toBeInTheDocument();
    expect(screen.getByText("Acima de 64 KB")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(1);
    fireEvent.click(abrir);
    const json = await screen.findByLabelText("JSON enviado");
    expect(api.get).toHaveBeenCalledWith("/integracoes/integracao-1/auditoria/1/payload");
    expect(json).toHaveTextContent("Melyssa Tatum");
    expect(json.textContent).toContain('\n  "responsavelId": 0');
    expect(json).toHaveTextContent("[OCULTO]");
    expect(json.querySelector("script")).toBeNull();
    expect(json).toHaveTextContent("<script>exemplo</script>");
    fireEvent.click(screen.getByRole("button", { name: "Fechar payload" }));
    expect(screen.queryByRole("region", { name: "Payload enviado" })).not.toBeInTheDocument();
  });

  it("mostra carregamento e erro no detalhe sem apagar o histórico", async () => {
    let rejeitar: (erro: Error) => void;
    vi.mocked(api.get).mockImplementation(async url => {
      if (url === "/integracoes/integracao-1/auditoria") return { data: eventos };
      return new Promise((_resolver, reject) => { rejeitar = reject; });
    });
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Ver payload" }));
    expect(screen.getByText("Carregando payload…")).toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    rejeitar!(new Error("Não foi possível carregar o payload."));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o payload.");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByLabelText("JSON enviado")).not.toBeInTheDocument();
  });
});
