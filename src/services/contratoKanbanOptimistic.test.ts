import { describe, expect, it } from "vitest";
import {
  moveTaskInBoard,
  type ContratoKanbanBoard,
  type ContratoKanbanTask,
} from "./useContratoKanban";

const task: ContratoKanbanTask = {
  id: 10,
  raiaId: 1,
  titulo: "Preparar diagnóstico",
  prioridade: "MEDIA",
  posicao: 0,
  subtarefas: [],
};

const board: ContratoKanbanBoard = {
  contratoId: 1,
  gestor: true,
  participantes: [],
  usuariosDisponiveis: [],
  raias: [
    { id: 1, titulo: "A fazer", posicao: 0, tasks: [task] },
    { id: 2, titulo: "Em andamento", posicao: 1, tasks: [] },
  ],
};

describe("movimentação otimista do Kanban de contratos", () => {
  it("move a tarefa imediatamente e preserva o estado anterior", () => {
    const updated = moveTaskInBoard(board, task.id, 2);

    expect(updated.raias[0].tasks).toHaveLength(0);
    expect(updated.raias[1].tasks[0]).toMatchObject({ id: 10, raiaId: 2 });
    expect(board.raias[0].tasks).toHaveLength(1);
    expect(board.raias[1].tasks).toHaveLength(0);
  });
});
