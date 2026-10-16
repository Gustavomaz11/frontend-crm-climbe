import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { EmpresaComprovantes } from "./EmpresaComprovantes";

vi.mock("@/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
const clients: QueryClient[] = [];
const create = vi.fn(() => "blob:http://localhost/comprovante");
const revoke = vi.fn();
const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client);
  return render(<QueryClientProvider client={client}><EmpresaComprovantes empresaId={7} nome="Empresa Exemplo" /></QueryClientProvider>);
};
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", { value: create, configurable: true });
  Object.defineProperty(URL, "revokeObjectURL", { value: revoke, configurable: true });
  vi.mocked(api.get).mockImplementation(async url => ({ data: String(url).endsWith("/pdf") ? new Blob(["%PDF-1.4"], { type: "application/pdf" }) : [{ id: 1, tipo: "RFB", status: "DISPONIVEL" }, { id: 2, tipo: "SIMPLES", status: "PROCESSANDO" }] }));
  vi.mocked(api.post).mockResolvedValue({ data: {} });
});
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); clients.length = 0; });

describe("comprovantes cadastrais da empresa", () => {
  it("consulta a lista ao abrir e mostra o PDF em modal sem emitir novos documentos", async () => {
    setup();
    const trigger = screen.getByRole("button", { name: "Visualizar comprovantes" });
    trigger.focus();
    expect(api.get).not.toHaveBeenCalled();
    fireEvent.click(trigger);
    expect(await screen.findByText("Emitindo comprovante...")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Visualizar Receita Federal" }));
    expect(await screen.findByTitle("Comprovante Receita Federal")).toHaveAttribute("src", "blob:http://localhost/comprovante");
    expect(api.get).toHaveBeenCalledWith("/empresas/7/comprovantes/1/pdf", expect.objectContaining({ responseType: "blob" }));
    expect(api.post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Voltar aos comprovantes" }));
    expect(revoke).toHaveBeenCalledWith("blob:http://localhost/comprovante");
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("permite tentar novamente apenas o comprovante que falhou", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 3, tipo: "CCC", status: "ERRO", mensagem: "Serviço indisponível" }] });
    setup(); fireEvent.click(screen.getByRole("button", { name: "Visualizar comprovantes" }));
    fireEvent.click(await screen.findByRole("button", { name: "Tentar novamente Cadastro de Contribuintes" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/empresas/7/comprovantes/3/tentar-novamente"));
  });
});
