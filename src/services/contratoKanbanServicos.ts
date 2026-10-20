import type { ContratoKanbanResumo } from "./useContratos";
import type { CommercialService } from "./commercialProposal";

export interface ContratoKanbanServico extends ContratoKanbanResumo {
  quadroId: string;
  quadroServico: CommercialService | null;
}

export const separarKanbansPorServico = (contratos: ContratoKanbanResumo[]): ContratoKanbanServico[] =>
  contratos.flatMap((contrato) => {
    const servicos = [...new Set(contrato.servicos?.length ? contrato.servicos.map((item) => item.servico)
      : contrato.servico ? [contrato.servico] : [])];
    return (servicos.length ? servicos : [null]).map((servico) => ({
      ...contrato, quadroId: `${contrato.id}:${servico || "SEM_SERVICO"}`, quadroServico: servico,
    }));
  });
