import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CargoGroupsPanel } from "./CargoGroupsPanel";

describe("CargoGroupsPanel", () => {
  it("cria grupos e mostra quantos cargos estão vinculados", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onFeedback = vi.fn();

    render(
      <CargoGroupsPanel
        cargos={[
          { id: 1, nome: "Diretor de TI", grupoId: 10 },
          { id: 2, nome: "Analista de TI", grupoId: 10 },
        ]}
        grupos={[{ id: 10, nome: "Tecnologia", descricao: "Produto e TI" }]}
        isLoading={false}
        isProcessing={false}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onFeedback={onFeedback}
      />,
    );

    expect(screen.getByText("2 cargos")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Nome do grupo"), { target: { value: "Comercial" } });
    fireEvent.change(screen.getByPlaceholderText("Descrição (opcional)"), { target: { value: "Vendas" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar grupo" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ nome: "Comercial", descricao: "Vendas" }));
    expect(onFeedback).toHaveBeenCalledWith("Grupo de cargos criado com sucesso.");
  });

  it("avisa que os cargos ficam sem grupo ao desativar", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <CargoGroupsPanel
        cargos={[{ id: 1, nome: "Diretor de TI", grupoId: 10 }]}
        grupos={[{ id: 10, nome: "Tecnologia" }]}
        isLoading={false}
        isProcessing={false}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
        onFeedback={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Excluir Tecnologia" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(10));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("1 cargo(s) vinculados ficarão sem grupo"));
    confirm.mockRestore();
  });
});
