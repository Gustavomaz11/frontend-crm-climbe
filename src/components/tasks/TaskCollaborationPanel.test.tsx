import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { TaskCollaborationPanel } from "./TaskCollaborationPanel";
import type { TarefaAnexo, TarefaComentario, TarefaTipo } from "@/services/useTarefaColaboracao";

vi.mock("@/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
const autor = { id: 1, nomeCompleto: "Ana" };
const file = new File(["pdf"], "balanco.pdf", { type: "application/pdf" });
const savedFile = (id: number): TarefaAnexo => ({ id, nome: file.name, contentType: file.type, tamanho: file.size, autor, criadoEm: "2026-10-09T09:00:00" });
const show = (tipo: TarefaTipo) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><TaskCollaborationPanel tipo={tipo} taskId={10} /></QueryClientProvider>);

describe("arquivos e conversas da tarefa", () => {
  beforeEach(() => vi.clearAllMocks());
  it.each<TarefaTipo>(["CONTRATO", "COMERCIAL"])("permite arquivos na tarefa, comentários e respostas em %s", async (tipo) => {
    const data: { anexos: TarefaAnexo[]; comentarios: TarefaComentario[] } = { anexos: [], comentarios: [] };
    vi.mocked(api.get).mockImplementation(async () => ({ data: { success: true, data: { ...data } } }));
    vi.mocked(api.post).mockImplementation(async (url, body) => {
      const form = body as FormData;
      if (String(url).endsWith("/anexos")) data.anexos = [savedFile(40)];
      else data.comentarios = [...data.comentarios, {
        id: data.comentarios.length + 30, autor, conteudo: String(form.get("conteudo")), criadoEm: "2026-10-09T09:00:00",
        comentarioPaiId: form.has("comentarioPaiId") ? Number(form.get("comentarioPaiId")) : null,
        anexos: form.getAll("arquivos").length ? [savedFile(41)] : [],
      }];
      return { data: { success: true, data: {} } };
    });
    show(tipo);
    await screen.findByText("Nenhum arquivo anexado.");
    fireEvent.change(screen.getByLabelText("Selecionar arquivos para a tarefa"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Anexar arquivos" }));
    await screen.findByRole("button", { name: "Baixar balanco.pdf" });
    expect(api.post).toHaveBeenCalledWith(`/tarefas/${tipo}/10/colaboracao/anexos`, expect.any(FormData), expect.anything());
    fireEvent.click(screen.getByRole("button", { name: "Publicar comentário" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Seu comentário");
    const input = screen.getByLabelText("Seu comentário *");
    expect(input).toHaveAttribute("data-field-error", "true");
    fireEvent.change(input, { target: { value: "Documentos enviados" } });
    expect(input).not.toHaveAttribute("data-field-error");
    fireEvent.change(screen.getByLabelText("Anexar arquivos ao comentário"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar comentário" }));
    await screen.findByText("Documentos enviados");
    const commentForm = vi.mocked(api.post).mock.calls[1][1] as FormData;
    expect(commentForm.get("conteudo")).toBe("Documentos enviados");
    expect(commentForm.getAll("arquivos")).toEqual([file]);
    fireEvent.click(screen.getByRole("button", { name: "Responder comentário de Ana" }));
    fireEvent.change(screen.getByLabelText("Sua resposta *"), { target: { value: "Conferi o arquivo" } });
    fireEvent.change(screen.getByLabelText("Anexar arquivos à resposta"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar resposta" }));
    await screen.findByText("Conferi o arquivo");
    const replyForm = vi.mocked(api.post).mock.calls[2][1] as FormData;
    expect(replyForm.get("comentarioPaiId")).toBe("30");
    expect(replyForm.getAll("arquivos")).toEqual([file]);
    expect(screen.getAllByRole("button", { name: "Responder comentário de Ana" })).toHaveLength(2);
  });

  it("mantém a mensagem e o arquivo selecionado quando o envio falha", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { anexos: [], comentarios: [] } } });
    vi.mocked(api.post).mockRejectedValue(new Error("Não foi possível salvar. Tente novamente."));
    show("CONTRATO");
    await screen.findByText("Nenhum arquivo anexado.");
    fireEvent.change(screen.getByLabelText("Seu comentário *"), { target: { value: "Confira os anexos" } });
    fireEvent.change(screen.getByLabelText("Anexar arquivos ao comentário"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar comentário" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Tente novamente"));
    expect(screen.getByLabelText("Seu comentário *")).toHaveValue("Confira os anexos");
    expect(screen.getByRole("button", { name: "Remover balanco.pdf" })).toBeInTheDocument();
  });
});
