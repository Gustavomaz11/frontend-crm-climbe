import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { AppHeaderUser } from "./layout/AppHeaderUser";

vi.mock("@/api", () => ({ api: { get: vi.fn(), patch: vi.fn() } }));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ basicUserData: { id: 7 } }) }));
const clients: QueryClient[] = [];
afterEach(() => { clients.forEach(c => c.clear()); clients.length = 0; vi.clearAllMocks(); });
function Location() { const location = useLocation(); return <output>{location.pathname}{location.search}</output>; }
function preparar(rota: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client);
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[rota]}><AppHeaderUser name="Pessoa" /><Location /></MemoryRouter></QueryClientProvider>);
}
describe("sino compartilhado", () => {
  it.each(["/propostas?proposta=12", "/contratos?contrato=34"])("abre o documento indicado no aviso: %s", async destino => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 2, mensagem: "Documento aprovado", destino, lida: false, dataCriacao: "2026-10-20T12:00:00" }] });
    vi.mocked(api.patch).mockResolvedValue({ data: {} }); preparar("/agenda");
    fireEvent.click(await screen.findByRole("button", { name: "Notificações, 1 não lidas" }));
    fireEvent.click(screen.getByRole("button", { name: /Documento aprovado/ }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/notificacoes/minhas/2/lida"));
    expect(screen.getByRole("status")).toHaveTextContent(destino);
  });
  it.each(["/agenda", "/contratos/kanban", "/pipeline-pre-vendas"])("abre avisos em %s e navega para a tarefa específica", async rota => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 1, mensagem: "Tarefa atribuída a você", destino: "/contratos/kanban?contrato=12&tarefaId=34", lida: false, dataCriacao: "2026-10-10T12:00:00" }] });
    vi.mocked(api.patch).mockResolvedValue({ data: {} }); preparar(rota);
    fireEvent.click(await screen.findByRole("button", { name: "Notificações, 1 não lidas" }));
    fireEvent.click(screen.getByRole("button", { name: /Tarefa atribuída a você/ }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/notificacoes/minhas/1/lida"));
    expect(screen.getByRole("status")).toHaveTextContent("/contratos/kanban?contrato=12&tarefaId=34");
  });
});
