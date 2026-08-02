import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PipelineComentariosPanel } from "./PipelineComentariosPanel";

const mocks = vi.hoisted(() => ({
  createComment: vi.fn(),
}));

vi.mock("@/services/usePipelineAtividades", () => ({
  usePipelineComentarios: () => ({
    data: [
      {
        id: 2,
        comentarioPaiId: 1,
        autorId: 2,
        autorNome: "Maria",
        conteudo: "Resposta existente",
        criadoEm: "2026-08-02T11:00:00",
      },
      {
        id: 1,
        comentarioPaiId: null,
        autorId: 1,
        autorNome: "Gustavo",
        conteudo: "Comentário principal",
        criadoEm: "2026-08-02T10:00:00",
      },
    ],
    isLoading: false,
  }),
  useCreatePipelineComentario: () => ({
    mutateAsync: mocks.createComment,
    isPending: false,
  }),
}));

describe("PipelineComentariosPanel", () => {
  beforeEach(() => {
    mocks.createComment.mockReset();
    mocks.createComment.mockResolvedValue({});
  });

  it("exibe respostas encadeadas e permite responder a um comentário", async () => {
    render(<PipelineComentariosPanel negocioId={10} canView canCreate />);

    const replies = screen.getByRole("list", { name: "Respostas ao comentário de Gustavo" });
    expect(replies).toHaveTextContent("Resposta existente");

    fireEvent.click(screen.getByRole("button", { name: "Responder ao comentário de Gustavo" }));
    fireEvent.change(screen.getByPlaceholderText("Responder a Gustavo..."), {
      target: { value: "Nova resposta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));

    await waitFor(() => expect(mocks.createComment).toHaveBeenCalledWith({
      negocioId: 10,
      conteudo: "Nova resposta",
      comentarioPaiId: 1,
    }));
  });
});
