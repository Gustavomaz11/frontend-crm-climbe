import { describe, expect, it } from "vitest";
import type { PipelineTarefa } from "@/services/usePipelineAtividades";
import { findNextTask, isOpenTask } from "./pipelineTaskUtils";

const task = (id: number, prazo: string, status: PipelineTarefa["status"]): PipelineTarefa => ({
  id,
  negocioId: 10,
  negocioNome: "Apex Ventures",
  titulo: `Tarefa ${id}`,
  responsavelId: 1,
  responsavelNome: "Usuário de Teste",
  prazo,
  prioridade: "MEDIA",
  status,
  tipo: "Follow-up",
  subtarefas: [],
  criadoEm: "2026-07-28T10:00:00",
  atualizadoEm: "2026-07-28T10:00:00",
});

describe("pipelineTaskUtils", () => {
  it("seleciona a tarefa aberta com o prazo mais próximo como próxima ação", () => {
    const next = findNextTask([
      task(1, "2026-07-30", "PENDENTE"),
      task(2, "2026-07-28", "CONCLUIDA"),
      task(3, "2026-07-29", "EM_ANDAMENTO"),
    ]);

    expect(next?.id).toBe(3);
  });

  it("não considera tarefas concluídas ou canceladas como abertas", () => {
    expect(isOpenTask(task(1, "2026-07-28", "PENDENTE"))).toBe(true);
    expect(isOpenTask(task(2, "2026-07-28", "CONCLUIDA"))).toBe(false);
    expect(isOpenTask(task(3, "2026-07-28", "CANCELADA"))).toBe(false);
  });
});
