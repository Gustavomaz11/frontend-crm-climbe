import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

interface ApiResponse<T> { success: boolean; data: T; message?: string }
export type CadenceStepType = "TAREFA" | "ESPERA" | "ENCERRAR" | "SEM_RESPOSTA";
export type TaskPriority = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

export interface CadenceStep {
  etapaFunilCodigo?: string;
  id?: number; ordem?: number; tipo: CadenceStepType; titulo?: string; descricao?: string;
  tipoTarefa?: string; prioridade?: TaskPriority; diasUteisEspera?: number;
  prazoDiasUteis?: number; scriptId?: number; scriptNome?: string;
}
export interface PipelineCampaignInput {
  nome: string; estrategia: string; descricao?: string; leadIds: number[]; participanteIds: number[];
  diasExecucao: number[]; scriptIds: number[]; etapas: CadenceStep[]; ativo: boolean;
}
export interface PipelineCampaign extends PipelineCampaignInput {
  id: number; execucoesAtivas: number; execucoesConcluidas: number; semResposta: number;
  criadoEm: string; atualizadoEm: string;
}
export interface CampaignLead {
  tipoFunil?: string; campanhaOrigemId?: number;
  id: number; empresa: string; contato: string; responsavel: string; servico: string; funil: string; etapa: string;
}

const unwrap = <T,>(response: ApiResponse<T>) => {
  if (!response.success) throw new Error(response.message || "Erro na API");
  return response.data;
};
const message = (error: unknown) => isAxiosError<ApiResponse<unknown>>(error)
  ? error.response?.data?.message || error.message : error instanceof Error ? error.message : "Erro na campanha";

export const usePipelineCampaigns = () => useQuery({
  queryKey: ["pipeline-campaigns"],
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineCampaign[]>>("/pipeline-vendas/campanhas")).data),
});
export const usePipelineCampaignLeads = () => useQuery({
  queryKey: ["pipeline-campaigns", "leads"],
  queryFn: async () => unwrap((await api.get<ApiResponse<CampaignLead[]>>("/pipeline-vendas/campanhas/leads")).data),
});

const useInvalidate = () => {
  const client = useQueryClient();
  return () => Promise.all([
    client.invalidateQueries({ queryKey: ["pipeline-campaigns"] }),
    client.invalidateQueries({ queryKey: ["pipeline-vendas"] }),
    client.invalidateQueries({ queryKey: ["pipeline-atividades"] }),
    client.invalidateQueries({ queryKey: ["pipeline-cadastros", "campanhas"] }),
  ]);
};

export const useCreatePipelineCampaign = () => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: async (data: PipelineCampaignInput) => {
    try { return unwrap((await api.post<ApiResponse<PipelineCampaign>>("/pipeline-vendas/campanhas", data)).data); }
    catch (error) { throw new Error(message(error)); }
  }, onSuccess: invalidate });
};
export const useUpdatePipelineCampaign = () => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: async ({ id, data }: { id: number; data: PipelineCampaignInput }) => {
    try { return unwrap((await api.put<ApiResponse<PipelineCampaign>>(`/pipeline-vendas/campanhas/${id}`, data)).data); }
    catch (error) { throw new Error(message(error)); }
  }, onSuccess: invalidate });
};
export const useTogglePipelineCampaign = () => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: async ({ id, ativo }: { id: number; ativo: boolean }) => {
    try { return unwrap((await api.patch<ApiResponse<PipelineCampaign>>(
      `/pipeline-vendas/campanhas/${id}/ativacao`, undefined, { params: { ativo } },
    )).data); } catch (error) { throw new Error(message(error)); }
  }, onSuccess: invalidate });
};
