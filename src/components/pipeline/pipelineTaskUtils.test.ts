import { describe, expect, it } from "vitest";
import type { PipelineTarefa } from "@/services/usePipelineAtividades";
import { classifyTaskDeadline, findNextTask, isOpenTask } from "./pipelineTaskUtils";

const task = (
  idOrOverrides: number | Partial<PipelineTarefa>,
  prazo?: string,
  status?: PipelineTarefa["status"],
): PipelineTarefa => ({
  id: typeof idOrOverrides === "number" ? idOrOverrides : 1,
  negocioId: 10,
  negocioNome: "Apex Ventures",
  titulo: `Tarefa ${typeof idOrOverrides === "number" ? idOrOverrides : 1}`,
  responsavelId: 1,
  responsavelNome: "Usuário de Teste",
  prazo: prazo || "2026-08-10",
  prioridade: "MEDIA",
  status: status || "PENDENTE",
  tipo: "Follow-up",
  subtarefas: [],
  criadoEm: "2026-07-28T10:00:00",
  atualizadoEm: "2026-07-28T10:00:00",
  ...(typeof idOrOverrides === "number" ? {} : idOrOverrides),
});

describe("pipelineTaskUtils", () => {
  it("classifica os prazos abertos em atrasado, atenção e no prazo", () => {
    const today = new Date("2026-08-03T12:00:00Z");

    expect(classifyTaskDeadline(task({ prazo: "2026-08-02" }), today).status).toBe("OVERDUE");
    expect(classifyTaskDeadline(task({ prazo: "2026-08-08" }), today).status).toBe("DUE_SOON");
    expect(classifyTaskDeadline(task({ prazo: "2026-08-09" }), today).status).toBe("ON_TRACK");
  });

  it("não sinaliza prazo de tarefa concluída", () => {
    const classification = classifyTaskDeadline(
      task({ prazo: "2026-08-02", status: "CONCLUIDA" }),
      new Date("2026-08-03T12:00:00Z"),
    );

    expect(classification.status).toBe("INACTIVE");
  });

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
