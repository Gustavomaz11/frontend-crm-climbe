import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { DriveFileList } from "./DriveFileList";

vi.mock("@/api", () => ({ api: { get: vi.fn() } }));
describe("visualização de arquivos do Drive", () => {
  afterEach(() => vi.restoreAllMocks());
  it("abre PDFs no sistema e libera a URL ao fechar a visualização", async () => {
    const revoke = vi.fn(); vi.stubGlobal("URL", { createObjectURL: () => "blob:pdf", revokeObjectURL: revoke });
    vi.mocked(api.get).mockResolvedValue({ data: new Blob(["pdf"], { type: "application/pdf" }) });
    render(<DriveFileList taskId={10} servico="BPO" files={[{ id: "pdf", nome: "Balanço.pdf", contentType: "application/pdf", tamanho: 3 }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir Balanço.pdf" }));
    await screen.findByRole("dialog", { name: "Visualizar Balanço.pdf" });
    expect(api.get).toHaveBeenCalledWith("/tarefas/CONTRATO/10/drive/BPO/arquivos/pdf/conteudo", expect.objectContaining({ responseType: "blob" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar visualização" }));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith("blob:pdf"));
    vi.unstubAllGlobals();
  });
});
