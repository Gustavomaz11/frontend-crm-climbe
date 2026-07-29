import { describe, expect, it } from "vitest";
import type { Reuniao } from "./useReunioes";
import { mergeCreatedReuniao } from "./useReunioes";

const reuniao = (id: number, dataHora: string): Reuniao => ({
  id,
  titulo: `Reunião ${id}`,
  dataHora,
  local: "",
  empresaId: 1,
});

describe("cache de reuniões", () => {
  it("insere imediatamente a reunião criada e mantém a ordem cronológica", () => {
    const atual = [reuniao(1, "2026-07-30T10:00:00")];
    const criada = reuniao(2, "2026-07-29T09:00:00");

    expect(mergeCreatedReuniao(atual, criada).map((item) => item.id)).toEqual([2, 1]);
  });

  it("substitui a reunião quando o mesmo id já existe no cache", () => {
    const atual = [reuniao(2, "2026-07-29T08:00:00")];
    const criada = reuniao(2, "2026-07-29T09:00:00");

    const resultado = mergeCreatedReuniao(atual, criada);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].dataHora).toBe("2026-07-29T09:00:00");
  });
});
