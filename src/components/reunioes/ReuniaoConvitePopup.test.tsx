import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { ReuniaoConvitePopup } from "./ReuniaoConvitePopup";

vi.mock("@/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (state: object) => unknown) => selector({ basicUserData: { id: 7 } }) }));
const convite = { idReuniao: 3, conviteId: 8, titulo: "Revisão de entregas", data: "2099-10-20", hora: "10:00", dataHoraFim: "2099-10-20T12:00:00", local: "Sala 1", minhaResposta: "PENDENTE" };
const clients: QueryClient[] = [];
const Location = () => { const location = useLocation(); return <output>{location.pathname}{location.search}</output>; };
const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client);
  return { client, ...render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/dashboard"]}><ReuniaoConvitePopup /><Location /></MemoryRouter></QueryClientProvider>) };
};
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear(); document.cookie = "CLIMB_ACCESS_TOKEN=teste; path=/";
  vi.mocked(api.get).mockResolvedValue({ data: [convite] });
});
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); clients.length = 0; document.cookie = "CLIMB_ACCESS_TOKEN=; Max-Age=0; path=/"; });

describe("popup dos convites recebidos", () => {
  it("mostra convite novo em qualquer tela e permite aceitar pelo sistema", async () => {
    vi.mocked(api.post).mockImplementation(async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });
      return { data: { ...convite, minhaResposta: "ACEITA" } };
    });
    setup();
    expect(await screen.findByRole("dialog", { name: convite.titulo })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aceitar reunião" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/reunioes/3/aceitar"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("/dashboard");
  });

  it("detecta convite que chega depois de o usuário já estar logado", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    const { client } = setup();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/reunioes/convites/pendentes"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    vi.mocked(api.get).mockResolvedValue({ data: [convite] });
    await act(async () => { await client.invalidateQueries({ queryKey: ["reunioes", "convites"] }); });
    expect(await screen.findByRole("dialog", { name: convite.titulo })).toBeInTheDocument();
  });

  it("não repete popup dispensado ao atualizar a lista ou navegar", async () => {
    const { client, unmount } = setup();
    fireEvent.click(await screen.findByRole("button", { name: "Agora não" }));
    await act(async () => { await client.invalidateQueries({ queryKey: ["reunioes", "convites"] }); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    unmount(); setup();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exibe o próximo convite sem sobrepor vários popups", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [convite, { ...convite, idReuniao: 4, conviteId: 9, titulo: "Segunda reunião" }] });
    setup();
    fireEvent.click(await screen.findByRole("button", { name: "Agora não" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Segunda reunião" })).toBeInTheDocument();
  });

  it("mantém o convite e permite tentar novamente se o aceite falhar", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("Não foi possível confirmar agora."));
    setup(); fireEvent.click(await screen.findByRole("button", { name: "Aceitar reunião" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível confirmar agora.");
    expect(screen.getByRole("button", { name: "Aceitar reunião" })).toBeEnabled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("abre os detalhes da reunião a partir do popup", async () => {
    setup(); fireEvent.click(await screen.findByRole("button", { name: "Ver detalhes" }));
    expect(screen.getByRole("status")).toHaveTextContent("/agenda?reuniaoId=3");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("não consulta convites quando não há sessão autenticada", () => {
    document.cookie = "CLIMB_ACCESS_TOKEN=; Max-Age=0; path=/";
    setup(); expect(api.get).not.toHaveBeenCalled(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
