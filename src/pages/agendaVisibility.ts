import type { Reuniao } from "@/services/useReunioes";

export const shouldShowAgendaReuniao = (
  _reuniao: Reuniao,
) => {
  // GET /reunioes já é limitado ao usuário autenticado pelo backend.
  // Revalidar com uma segunda consulta causa eventos piscarem e desaparecerem.
  return true;
};
