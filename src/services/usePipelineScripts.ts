import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

interface ApiResponse<T> { success: boolean; data: T; message?: string }
export type PipelineScriptCanal = "EMAIL" | "WHATSAPP" | "TELEFONE" | "LINKEDIN" | "REUNIAO" | "OUTRO";

export interface PipelineScript {
  id: number; nome: string; categoria: string; canal: PipelineScriptCanal;
  modeloMensagem: string; ativo: boolean; criadoEm: string; atualizadoEm: string;
}
export interface PipelineScriptInput {
  nome: string; categoria: string; canal: PipelineScriptCanal; modeloMensagem: string; ativo: boolean;
}
export interface PipelineScriptPerformance { scriptId: number; tarefasGeradas: number; tarefasConcluidas: number; taxaConclusao: number }

const unwrap = <T,>(response: ApiResponse<T>) => {
  if (!response.success) throw new Error(response.message || "Erro na API");
  return response.data;
};
const message = (error: unknown) => isAxiosError<ApiResponse<unknown>>(error)
  ? error.response?.data?.message || error.message : error instanceof Error ? error.message : "Erro ao salvar script";

export const usePipelineScripts = (onlyActive = false) => useQuery({
  queryKey: ["pipeline-scripts", onlyActive],
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineScript[]>>("/pipeline-vendas/scripts", {
    params: { somenteAtivos: onlyActive },
  })).data),
});

export const usePipelineScriptPerformance = (id?: number) => useQuery({
  queryKey: ["pipeline-scripts", id, "performance"],
  enabled: Boolean(id),
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineScriptPerformance>>(
    `/pipeline-vendas/scripts/${id}/desempenho`,
  )).data),
});

const useInvalidate = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["pipeline-scripts"] });
};

export const useCreatePipelineScript = () => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: async (data: PipelineScriptInput) => {
    try { return unwrap((await api.post<ApiResponse<PipelineScript>>("/pipeline-vendas/scripts", data)).data); }
    catch (error) { throw new Error(message(error)); }
  }, onSuccess: invalidate });
};

export const useUpdatePipelineScript = () => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: async ({ id, data }: { id: number; data: PipelineScriptInput }) => {
    try { return unwrap((await api.put<ApiResponse<PipelineScript>>(`/pipeline-vendas/scripts/${id}`, data)).data); }
    catch (error) { throw new Error(message(error)); }
  }, onSuccess: invalidate });
};
