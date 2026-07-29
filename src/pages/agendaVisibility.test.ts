import { describe, expect, it } from "vitest";
import type { Reuniao } from "@/services/useReunioes";
import { shouldShowAgendaReuniao } from "./agendaVisibility";

describe("visibilidade da agenda", () => {
  it("mantem evento externo da agenda Google mesmo sem participante local", () => {
    const eventoGoogle: Reuniao = {
      id: -42,
      titulo: "Evento corporativo",
      dataHora: "2026-07-30T09:00:00-03:00",
      local: "",
      empresaId: 0,
      status: "GOOGLE_CALENDAR",
      googleEventId: "google-event-42",
    };

    expect(shouldShowAgendaReuniao(eventoGoogle)).toBe(true);
  });

  it("mantem reuniao autorizada pelo backend quando participantes terminam vazios", () => {
    const reuniaoLocal: Reuniao = {
      id: 15,
      titulo: "Reunião autorizada",
      dataHora: "2026-07-30T10:00:00-03:00",
      local: "Sala 1",
      empresaId: 3,
      status: "AGENDADA",
    };

    expect(shouldShowAgendaReuniao(reuniaoLocal)).toBe(true);
  });
});
