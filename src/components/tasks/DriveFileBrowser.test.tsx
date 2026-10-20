import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { DriveFileBrowser } from "./DriveFileBrowser";
import { TaskCollaborationPanel } from "./TaskCollaborationPanel";
import type { DriveArquivo } from "@/services/useTarefaDrive";

vi.mock("@/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
const arquivo = (id: string, nome: string, pasta = false): DriveArquivo => ({ id, nome, contentType: pasta ? "application/vnd.google-apps.folder" : "application/pdf", tamanho: 10 });
const envelope = (data: unknown) => ({ data: { success: true, data } });
const show = (content = <DriveFileBrowser taskId={10} />) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{content}</QueryClientProvider>);

describe("arquivos compartilhados do Drive", () => {
  beforeEach(() => vi.clearAllMocks());

  it("seleciona serviços, navega subpastas e atualiza todas as tarefas após criar pasta ou enviar arquivos", async () => {
    const files: Record<string, DriveArquivo[]> = { BPO: [arquivo("ano", "2026", true)], CFO: [arquivo("pdf", "Resumo.pdf")], ano: [] };
    vi.mocked(api.get).mockImplementation(async (url, config) => {
      if (String(url).endsWith("/drive")) return envelope({ servicos: [{ servico: "BPO", nome: "BPO", pastaId: "bpo" }, { servico: "CFO", nome: "CFO", pastaId: "cfo" }] });
      const service = String(url).includes("/CFO/") ? "CFO" : "BPO";
      return envelope([...(files[config?.params?.pastaId || service] || [])]);
    });
    vi.mocked(api.post).mockImplementation(async (url, body) => {
      if (String(url).endsWith("/pastas")) {
        const input = body as { nome: string; pastaPaiId: string | null };
        const folder = arquivo("nova", input.nome, true); files[input.pastaPaiId || "BPO"].push(folder);
        return envelope(folder);
      }
      const form = body as FormData;
      files[String(form.get("pastaId"))].push(arquivo("upload", "Balanço.pdf"));
      return envelope([]);
    });
    show(<><DriveFileBrowser taskId={10} /><DriveFileBrowser taskId={20} /></>);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Abrir pasta 2026" })).toHaveLength(2));
    const regions = screen.getAllByRole("region", { name: "Pastas e arquivos do serviço" });
    const first = within(regions[0]); const second = within(regions[1]);
    fireEvent.click(first.getByRole("button", { name: "Nova pasta" }));
    fireEvent.change(first.getByLabelText("Nome da pasta *"), { target: { value: "Relatórios" } });
    fireEvent.click(first.getByRole("button", { name: "Criar pasta" }));
    await waitFor(() => expect(second.getByRole("button", { name: "Abrir pasta Relatórios" })).toBeInTheDocument());
    expect(api.post).toHaveBeenCalledWith("/tarefas/CONTRATO/10/drive/BPO/pastas", { nome: "Relatórios", pastaPaiId: null });
    fireEvent.click(first.getByRole("button", { name: "Abrir pasta 2026" }));
    const file = new File(["pdf"], "Balanço.pdf", { type: "application/pdf" });
    fireEvent.change(first.getByLabelText("Selecionar arquivos para o serviço"), { target: { files: [file] } });
    fireEvent.click(first.getByRole("button", { name: "Enviar ao Drive" }));
    await first.findByRole("button", { name: "Baixar Balanço.pdf" });
    const form = vi.mocked(api.post).mock.calls[1][1] as FormData;
    expect(form.get("pastaId")).toBe("ano"); expect(form.getAll("arquivos")).toEqual([file]);
    fireEvent.click(second.getByRole("button", { name: "Abrir pasta 2026" }));
    await second.findByRole("button", { name: "Abrir Balanço.pdf" });
    fireEvent.change(first.getByLabelText("Serviço contratado"), { target: { value: "CFO" } });
    await first.findByRole("button", { name: "Baixar Resumo.pdf" });
    expect(first.queryByText("Balanço.pdf")).not.toBeInTheDocument();
  });

  it("mantém o arquivo selecionado após falha de envio ao Drive", async () => {
    vi.mocked(api.get).mockImplementation(async (url) => envelope(String(url).endsWith("/drive")
      ? { servicos: [{ servico: "BPO", nome: "BPO", pastaId: "bpo" }] } : []));
    vi.mocked(api.post).mockRejectedValue(new Error("Drive indisponível"));
    show();
    const picker = await screen.findByLabelText("Selecionar arquivos para o serviço");
    fireEvent.change(picker, { target: { files: [new File(["pdf"], "Balanço.pdf")] } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar ao Drive" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent("Drive indisponível");
    expect(screen.getByRole("button", { name: "Remover Balanço.pdf" })).toBeInTheDocument();
  });

  it("preserva arquivos antigos de contratos para consulta e direciona novos envios ao serviço", async () => {
    vi.mocked(api.get).mockImplementation(async (url) => envelope(String(url).endsWith("/drive")
      ? { servicos: [{ servico: "BPO", nome: "BPO", pastaId: null }], mensagem: "Autorize a conta responsável." }
      : { anexos: [{ id: 1, nome: "Antigo.pdf", contentType: "application/pdf", tamanho: 10, autor: { id: 1, nomeCompleto: "Ana" }, criadoEm: "2026-10-20" }], pastas: [], comentarios: [] }));
    show(<TaskCollaborationPanel tipo="CONTRATO" taskId={10} />);
    await screen.findByText("Arquivos anteriores da tarefa");
    fireEvent.click(screen.getByText("Arquivos anteriores da tarefa"));
    expect(screen.getByRole("button", { name: "Baixar Antigo.pdf" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Selecionar arquivos para a tarefa")).not.toBeInTheDocument();
    expect(await screen.findByText("Autorize a conta responsável.")).toBeInTheDocument();
  });
});
