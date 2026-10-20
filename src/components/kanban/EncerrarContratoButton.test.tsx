import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { EncerrarContratoButton } from "./EncerrarContratoButton";

vi.mock("@/api", () => ({ api: { patch: vi.fn() } }));
const clients: QueryClient[] = [];
const onClosed = vi.fn();
const abrir = (permitido = true) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } }); clients.push(client);
  render(<QueryClientProvider client={client}><EncerrarContratoButton contratoId={10} servico="CFO"
    titulo="Datawer Tec - CFO" permitido={permitido} onClosed={onClosed} /></QueryClientProvider>);
};
beforeEach(() => { vi.resetAllMocks(); vi.mocked(api.patch).mockResolvedValue({ data: {} }); });
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); clients.length = 0; });

describe("botão de encerramento do serviço", () => {
  it("fica desabilitado para quem não é responsável pelo serviço", () => {
    abrir(false);
    const button = screen.getByRole("button", { name: "Encerrar Contrato" });
    expect(button).toBeDisabled(); fireEvent.click(button);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(); expect(api.patch).not.toHaveBeenCalled();
  });

  it("confirma o serviço selecionado e permite cancelar", () => {
    abrir(); fireEvent.click(screen.getByRole("button", { name: "Encerrar Contrato" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Encerrar Datawer Tec - CFO?");
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Os outros serviços da empresa continuarão ativos");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("envia o serviço aberto e fecha o diálogo após o sucesso", async () => {
    abrir(); fireEvent.click(screen.getByRole("button", { name: "Encerrar Contrato" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar encerramento" }));
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(api.patch).toHaveBeenCalledWith("/contratos/10/kanban/encerrar", { servico: "CFO" });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("mantém o diálogo aberto e apresenta a recusa do backend", async () => {
    vi.mocked(api.patch).mockRejectedValue(Object.assign(new Error(), { isAxiosError: true, response: { data: { detail: "Somente o responsável pelo serviço pode encerrar." } } }));
    abrir(); fireEvent.click(screen.getByRole("button", { name: "Encerrar Contrato" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar encerramento" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Somente o responsável pelo serviço"));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument(); expect(onClosed).not.toHaveBeenCalled();
  });
});
