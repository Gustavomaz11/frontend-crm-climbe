import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { RevisaoDocumentoDialog } from "./RevisaoDocumentoDialog";

const getRevisaoInternaMock = vi.fn();

vi.mock("@/services", () => ({
  getRevisaoInterna: (...args: unknown[]) => getRevisaoInternaMock(...args),
  getRevisaoInternalPageBlob: vi.fn().mockResolvedValue("blob:pagina-1"),
  enviarNovaVersao: vi.fn(),
  reenviarRevisao: vi.fn(),
}));

const revisao = {
  id: 1,
  tipo: "PROPOSTA",
  referenciaId: 7,
  empresaNome: "Apex",
  destinatarioEmail: "cliente@apex.com",
  status: "AJUSTES_SOLICITADOS",
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
    resultado: "AJUSTES_SOLICITADOS",
    criadoEm: "2026-08-04T12:41:00",
    anotacoes: [{ id: 99, pagina: 1, x: 0.1, y: 0.2, largura: 0.3, altura: 0.05, cor: "#FACC15", comentario: "Ajustar cláusula" }],
  }],
};

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  class IntersectionObserverMock {
    private readonly callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }
    observe() { this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    disconnect() {}
    unobserve() {}
    takeRecords() { return []; }
    root = null;
    rootMargin = "0px";
    thresholds = [0];
  }
  Object.defineProperty(window, "IntersectionObserver", { configurable: true, value: IntersectionObserverMock });
});

describe("RevisaoDocumentoDialog", () => {
  it("permite navegar entre comentário e trecho marcado na revisão aberta pelo pipeline", async () => {
    getRevisaoInternaMock.mockResolvedValue(revisao);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RevisaoDocumentoDialog open tipo="PROPOSTA" referenciaId={7} onClose={vi.fn()} />
      </QueryClientProvider>,
    );

    const comment = await screen.findByRole("button", { name: /Marcação 1.*página 1/i });
    const mark = screen.getByRole("button", { name: "Marcação: Ajustar cláusula" });
    fireEvent.click(comment);
    await waitFor(() => expect(mark).toHaveAttribute("aria-pressed", "true"));

    fireEvent.click(mark);
    await waitFor(() => expect(comment).toHaveAttribute("aria-pressed", "true"));
  });
});
