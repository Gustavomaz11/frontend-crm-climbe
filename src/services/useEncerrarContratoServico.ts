import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";
import type { CommercialService } from "./commercialProposal";
import type { ContratoKanbanResumo } from "./useContratos";

interface EncerrarServico {
  contratoId: number;
  servico: CommercialService | null;
}

export const useEncerrarContratoServico = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ contratoId, servico }: EncerrarServico) => {
      try {
        await api.patch(`/contratos/${contratoId}/kanban/encerrar`, { servico });
      } catch (error) {
        if (isAxiosError(error)) throw new Error(error.response?.data?.detail || error.response?.data?.message || "Não foi possível encerrar o serviço.");
        throw error;
      }
    },
    onSuccess: async (_, { contratoId, servico }) => {
      await client.cancelQueries({ queryKey: ["contratos", contratoId] });
      client.setQueriesData<ContratoKanbanResumo[]>({ queryKey: ["contratos", "kanban-resumos"] }, anteriores =>
        anteriores?.flatMap(contrato => {
          if (contrato.id !== contratoId) return [contrato];
          const servicos = (contrato.servicos?.length ? contrato.servicos
            : contrato.servico ? [{ servico: contrato.servico }] : []).filter(item => item.servico !== servico);
          return servicos.length ? [{ ...contrato, servicos, servico: servicos[0].servico }] : [];
        }));
      await Promise.all([
        client.invalidateQueries({ queryKey: ["contratos", contratoId], refetchType: "none" }),
        client.invalidateQueries({ queryKey: ["contratos", "kanban-resumos"] }),
        client.invalidateQueries({ queryKey: ["contratos", "kanban-acesso"] }),
        client.invalidateQueries({ queryKey: ["contratos"], exact: true }),
      ]);
    },
  });
};
