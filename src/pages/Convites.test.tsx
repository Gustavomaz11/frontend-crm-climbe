import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import Convites from "./Convites";

const acesso = vi.hoisted(() => ({ autorizado: true }));
vi.mock("@/api", () => ({ api: { post: vi.fn() } }));
vi.mock("@/components/layout/AppPageShell", () => ({ AppPageShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (select: (state: unknown) => unknown) => select({ basicUserData: { id: 3 } }) }));
vi.mock("@/services/usePermissoes", () => ({ useUsuarioPermissoes: () => ({ data: acesso.autorizado ? [{ permissao: { codigo: "PERMITIR_ACESSO" } }] : [], isLoading: false }) }));

const abrir = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}><Convites /></QueryClientProvider>);
beforeEach(() => { vi.clearAllMocks(); acesso.autorizado = true; });

describe("convites em lote", () => {
  it("normaliza e elimina repetidos antes de enviar e informa agendamento", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { agendados: 2, duplicadosIgnorados: 0 } });
    abrir();
    fireEvent.change(screen.getByLabelText("E-mails dos destinatários"), { target: { value: " SOCIO@example.com; socio@example.com\noutra@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar convites" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/convites", { emails: ["socio@example.com", "outra@example.com"] }));
    expect(await screen.findByRole("status")).toHaveTextContent("2 convite(s) adicionado(s) à fila");
    expect(screen.getByLabelText("E-mails dos destinatários")).toHaveValue("");
  });

  it("bloqueia lote inválido e lote maior que cem destinatários", () => {
    abrir();
    const campo = screen.getByLabelText("E-mails dos destinatários");
    fireEvent.change(campo, { target: { value: "valido@example.com; invalido" } });
    expect(screen.getByRole("button", { name: "Enviar convites" })).toBeDisabled();
    fireEvent.change(campo, { target: { value: Array.from({ length: 101 }, (_, i) => `socio${i}@example.com`).join("\n") } });
    expect(screen.getByRole("button", { name: "Enviar convites" })).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("preserva destinatários quando a API falha para permitir nova tentativa", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("Falha de conexão"));
    abrir();
    fireEvent.change(screen.getByLabelText("E-mails dos destinatários"), { target: { value: "socio@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar convites" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha de conexão");
    expect(screen.getByLabelText("E-mails dos destinatários")).toHaveValue("socio@example.com");
  });

  it("impede acesso ao formulário sem a permissão de gerenciar acessos", () => {
    acesso.autorizado = false;
    abrir();
    expect(screen.getByRole("alert")).toHaveTextContent("Você não tem permissão");
    expect(screen.queryByRole("button", { name: "Enviar convites" })).not.toBeInTheDocument();
  });
});
