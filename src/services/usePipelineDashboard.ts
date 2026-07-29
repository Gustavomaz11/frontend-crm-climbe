import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";

interface ApiResponse<T> { success: boolean; data: T; message?: string }
export type PipelineSituacao = "ABERTO" | "GANHO" | "PERDIDO";

export interface PipelineDashboardFilters {
  dataInicio?: string; dataFim?: string; responsavelId?: number; funilId?: number;
  estrategia?: string; servico?: string; origem?: string; empresaId?: number;
  situacao?: PipelineSituacao;
}

export interface PipelineConversao { chave: string; total: number; ganhos: number; perdidos: number; taxaConversao: number }
export interface PipelineDashboard {
  resumo: {
    negociosAbertos: number; negociosGanhos: number; negociosPerdidos: number; taxaConversao: number;
    valorTotalPropostas: number; valorContratosFechados: number; tempoMedioFechamentoDias: number;
    negociosEstagnados: number; tarefasAtrasadas: number;
  };
  conversaoPorEtapa: PipelineConversao[];
  conversaoPorFunil: PipelineConversao[];
  conversaoPorEstrategia: PipelineConversao[];
  conversaoPorResponsavel: PipelineConversao[];
  tempoMedioPorEtapa: { etapaId: number; etapa: string; funil: string; mediaDias: number }[];
  principaisMotivosPerda: { motivoId: number; motivo: string; quantidade: number; percentual: number }[];
  negociosEstagnados: { negocioId: number; empresa: string; etapa: string; funil: string; responsavel: string; diasSemMovimentacao: number; limiteDias: number }[];
  opcoes: { estrategias: string[]; servicos: string[]; origens: string[] };
}

export const usePipelineDashboard = (filters: PipelineDashboardFilters) => useQuery({
  queryKey: ["pipeline-dashboard", filters],
  queryFn: async () => {
    const response = await api.get<ApiResponse<PipelineDashboard>>("/pipeline-vendas/dashboard", { params: filters });
    if (!response.data.success) throw new Error(response.data.message || "Erro ao carregar dashboard");
    return response.data.data;
  },
});
