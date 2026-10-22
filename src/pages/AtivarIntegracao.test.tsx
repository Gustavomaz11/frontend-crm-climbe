import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AtivarIntegracao from "./AtivarIntegracao";
import { ativarIntegracao } from "@/services/useIntegracoes";

vi.mock("@/services/useIntegracoes", () => ({ ativarIntegracao: vi.fn(), erroIntegracao: () => "Link inválido ou expirado." }));
describe("ativação de integração", () => {
  beforeEach(() => { vi.clearAllMocks(); window.history.replaceState(null, "", "/integracoes/ativar#token=exemplo-de-uso-unico"); });
  it("remove o segredo da URL e exige ação explícita para consumir o link", async () => {
    vi.mocked(ativarIntegracao).mockResolvedValue({ client_id: "climbe_exemplo", client_secret: "segredo-exemplo" });
    render(<AtivarIntegracao />);
    expect(window.location.hash).toBe(""); expect(ativarIntegracao).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ativar e mostrar credenciais" }));
    await screen.findByText("Integração ativada");
    expect(ativarIntegracao).toHaveBeenCalledExactlyOnceWith("exemplo-de-uso-unico");
    expect(screen.getByLabelText("CLIENT_SECRET")).toHaveValue("segredo-exemplo");
    expect(localStorage.getItem("client_secret")).toBeNull(); expect(sessionStorage.getItem("client_secret")).toBeNull();
  });
  it("não tenta ativar automaticamente ao abrir novamente sem token", () => {
    window.history.replaceState(null, "", "/integracoes/ativar"); render(<AtivarIntegracao />);
    expect(screen.getByRole("alert")).toHaveTextContent("Abra o link recebido por e-mail"); expect(ativarIntegracao).not.toHaveBeenCalled();
  });
  it("apresenta erro de ativação sem exibir credenciais", async () => {
    vi.mocked(ativarIntegracao).mockRejectedValue(new Error("401")); render(<AtivarIntegracao />);
    fireEvent.click(screen.getByRole("button", { name: "Ativar e mostrar credenciais" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Link inválido ou expirado."));
    expect(screen.queryByLabelText("CLIENT_SECRET")).not.toBeInTheDocument();
  });
});
