import { isReuniaoCancelada, type Reuniao } from "@/services/useReunioes";

export const shouldShowAgendaReuniao = (
  reuniao: Pick<Reuniao, "status">,
) => {
  // GET /reunioes já é limitado ao usuário autenticado pelo backend.
  // Revalidar com uma segunda consulta causa eventos piscarem e desaparecerem.
  return !isReuniaoCancelada(reuniao);
};
