import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { TaskCollaborationPanel } from "./TaskCollaborationPanel";
import type { TarefaAnexo, TarefaPasta, TarefaTipo } from "@/services/useTarefaColaboracao";

vi.mock("@/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
const autor = { id: 1, nomeCompleto: "Ana" };
const primeiro = new File(["pdf"], "balanco.pdf", { type: "application/pdf" });
const segundo = new File(["pdf"], "contrato.pdf", { type: "application/pdf" });
const terceiro = new File(["pdf"], "proposta.pdf", { type: "application/pdf" });
const show = (tipo: TarefaTipo) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><TaskCollaborationPanel tipo={tipo} taskId={10} /></QueryClientProvider>);
const pasta = (id: number, nome: string, pastaPaiId: number | null): TarefaPasta => ({ id, nome, pastaPaiId, autor, criadoEm: "2026-10-09T09:00:00" });
const dados = () => {
  const data: { pastas: TarefaPasta[]; anexos: TarefaAnexo[]; comentarios: [] } = { pastas: [], anexos: [], comentarios: [] };
  vi.mocked(api.get).mockImplementation(async () => ({ data: { success: true, data: { ...data } } }));
  return data;
};

describe("pastas de arquivos da tarefa", () => {
  beforeEach(() => vi.clearAllMocks());
  it.each<TarefaTipo>(["CONTRATO", "COMERCIAL"])("cria pastas e subpastas, envia múltiplos arquivos ao destino e permite novos uploads em %s", async (tipo) => {
    const data = dados();
    vi.mocked(api.post).mockImplementation(async (url, body) => {
      if (String(url).endsWith("/pastas")) {
        const input = body as { nome: string; pastaPaiId: number | null };
        const criada = pasta(50 + data.pastas.length, input.nome, input.pastaPaiId);
        data.pastas = [...data.pastas, criada];
        return { data: { success: true, data: criada } };
      }
      const form = body as FormData;
      const adicionados = form.getAll("arquivos").map((item, index) => {
        const file = item as File;
        return { id: 70 + data.anexos.length + index, nome: file.name, contentType: file.type, tamanho: file.size,
          autor, criadoEm: "2026-10-09T09:00:00", pastaId: Number(form.get("pastaId")) };
      });
      data.anexos = [...data.anexos, ...adicionados];
      return { data: { success: true, data: adicionados } };
    });
    const view = show(tipo);
    await screen.findByRole("button", { name: "Nova pasta" });
    fireEvent.click(screen.getByRole("button", { name: "Nova pasta" }));
    fireEvent.click(screen.getByRole("button", { name: "Criar pasta" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Nome da pasta");
    fireEvent.change(screen.getByLabelText("Nome da pasta *"), { target: { value: "Documentos" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar pasta" }));
    await screen.findByRole("region", { name: "Conteúdo da pasta Documentos" });
    fireEvent.click(screen.getByRole("button", { name: "Nova subpasta" }));
    fireEvent.change(screen.getByLabelText("Nome da pasta *"), { target: { value: "2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar pasta" }));
    await screen.findByRole("region", { name: "Conteúdo da pasta 2026" });
    const picker = screen.getByLabelText("Adicionar arquivos à pasta 2026");
    expect(picker).toHaveAttribute("multiple");
    fireEvent.change(picker, { target: { files: [primeiro, segundo] } });
    fireEvent.click(screen.getByRole("button", { name: "Anexar arquivos" }));
    await screen.findByRole("button", { name: "Baixar contrato.pdf" });
    const form = vi.mocked(api.post).mock.calls[2][1] as FormData;
    expect(form.getAll("arquivos")).toEqual([primeiro, segundo]); expect(form.get("pastaId")).toBe("51");
    expect(vi.mocked(api.post).mock.calls[1][1]).toEqual({ nome: "2026", pastaPaiId: 50 });
    fireEvent.change(screen.getByLabelText("Adicionar arquivos à pasta 2026"), { target: { files: [terceiro] } });
    fireEvent.click(screen.getByRole("button", { name: "Anexar arquivos" }));
    await screen.findByRole("button", { name: "Baixar proposta.pdf" });
    expect(screen.getByRole("button", { name: "Baixar balanco.pdf" })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("navigation", { name: "Local dos arquivos" })).getByRole("button", { name: "Documentos" }));
    expect(screen.queryByRole("button", { name: "Baixar balanco.pdf" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir pasta 2026" })).toHaveTextContent("3 arquivo(s)");
    view.unmount(); show(tipo);
    fireEvent.click(await screen.findByRole("button", { name: "Abrir pasta Documentos" }));
    fireEvent.click(screen.getByRole("button", { name: "Abrir pasta 2026" }));
    expect(screen.getByRole("button", { name: "Baixar proposta.pdf" })).toBeInTheDocument();
  });

  it("abre Anexos automaticamente após enviar vários arquivos sem escolher uma pasta", async () => {
    const data = dados();
    vi.mocked(api.post).mockImplementation(async () => {
      data.pastas = [pasta(50, "Anexos", null)];
      data.anexos = [primeiro, segundo].map((file, index) => ({ id: 70 + index, nome: file.name, contentType: file.type,
        tamanho: file.size, autor, criadoEm: "2026-10-09T09:00:00", pastaId: 50 }));
      return { data: { success: true, data: data.anexos } };
    });
    show("CONTRATO");
    const picker = await screen.findByLabelText("Selecionar arquivos para a tarefa");
    fireEvent.change(picker, { target: { files: [primeiro, segundo] } });
    fireEvent.click(screen.getByRole("button", { name: "Anexar arquivos" }));
    await screen.findByRole("region", { name: "Conteúdo da pasta Anexos" });
    expect(screen.getByRole("button", { name: "Baixar contrato.pdf" })).toBeInTheDocument();
    expect(screen.getByLabelText("Adicionar arquivos à pasta Anexos")).toHaveAttribute("multiple");
  });

  it("preserva o destino e os arquivos quando o upload na subpasta falha", async () => {
    const data = dados(); data.pastas = [pasta(50, "Documentos", null), pasta(51, "2026", 50)];
    vi.mocked(api.post).mockRejectedValue(new Error("Não foi possível salvar. Tente novamente."));
    show("COMERCIAL");
    fireEvent.click(await screen.findByRole("button", { name: "Abrir pasta Documentos" }));
    fireEvent.click(screen.getByRole("button", { name: "Abrir pasta 2026" }));
    fireEvent.change(screen.getByLabelText("Adicionar arquivos à pasta 2026"), { target: { files: [primeiro, segundo] } });
    fireEvent.click(screen.getByRole("button", { name: "Anexar arquivos" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Tente novamente"));
    expect(screen.getByRole("region", { name: "Conteúdo da pasta 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover balanco.pdf" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover contrato.pdf" })).toBeInTheDocument();
  });
});
