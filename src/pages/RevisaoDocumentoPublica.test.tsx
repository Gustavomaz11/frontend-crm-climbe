import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import RevisaoDocumentoPublica from "./RevisaoDocumentoPublica";

const getRevisaoPublicaMock = vi.fn();

vi.mock("@/services", () => ({
  getRevisaoPublica: (...args: unknown[]) => getRevisaoPublicaMock(...args),
  getRevisaoPublicPageUrl: () => "https://example.com/pagina-1.png",
  enviarRevisaoPublica: vi.fn(),
  aprovarRevisaoPublica: vi.fn(),
  reprovarRevisaoPublica: vi.fn(),
}));

const revisao = {
  id: 1,
  tipo: "PROPOSTA",
  referenciaId: 7,
  empresaNome: "Apex",
  destinatarioEmail: "cliente@apex.com",
  status: "AGUARDANDO_CLIENTE",
  versaoAtual: 1,
  nomeArquivo: "proposta.pdf",
  contentType: "application/pdf",
  totalPaginas: 1,
  tokenExpiraEm: "2026-09-03T12:41:00",
  criadoEm: "2026-08-04T12:41:00",
  atualizadoEm: "2026-08-04T12:41:00",
  emailStatus: "ENVIADO",
  versoes: [{
    id: 10,
    numero: 1,
    nomeArquivo: "proposta.pdf",
    contentType: "application/pdf",
    totalPaginas: 1,
    resultado: "AGUARDANDO_CLIENTE",
    criadoEm: "2026-08-04T12:41:00",
    anotacoes: [{ id: 99, pagina: 1, x: 0.1, y: 0.2, largura: 0.3, altura: 0.05, cor: "#FACC15", comentario: "Ajustar cláusula" }],
  }],
};

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});

describe("RevisaoDocumentoPublica", () => {
  it("bloqueia a decisão e sincroniza comentário e trecho quando existem marcações", async () => {
    getRevisaoPublicaMock.mockResolvedValue(revisao);
    render(
      <MemoryRouter initialEntries={["/revisao/token-teste"]}>
        <Routes><Route path="/revisao/:token" element={<RevisaoDocumentoPublica />} /></Routes>
      </MemoryRouter>,
    );

    const approve = await screen.findByRole("button", { name: "Aprovar" });
    expect(approve).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reprovar" })).toBeDisabled();

    const comment = screen.getByRole("button", { name: /Marcação 1.*página 1/i });
    const mark = screen.getByRole("button", { name: "Marcação: Ajustar cláusula" });
    fireEvent.click(comment);
    await waitFor(() => expect(mark).toHaveAttribute("aria-pressed", "true"));

    fireEvent.click(mark);
    await waitFor(() => expect(comment).toHaveAttribute("aria-pressed", "true"));
  });
});
