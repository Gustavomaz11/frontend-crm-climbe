import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";

interface ApiResponse<T> { success: boolean; data: T; message?: string }

export interface PipelineMotivoPerda {
  id: number;
  nome: string;
  descricao?: string | null;
  posicao: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PipelineMotivoPerdaInput {
  nome: string;
  descricao?: string | null;
  ativo: boolean;
}

const unwrap = <T,>(response: ApiResponse<T>) => {
  if (!response.success) throw new Error(response.message || "Erro na API");
  return response.data;
};

export const usePipelineMotivosPerdaAtivos = () => useQuery({
  queryKey: ["pipeline-motivos-perda", "ativos"],
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineMotivoPerda[]>>(
    "/pipeline-vendas/motivos-perda/ativos",
  )).data),
});

export const usePipelineMotivosPerdaAdmin = () => useQuery({
  queryKey: ["pipeline-motivos-perda", "admin"],
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineMotivoPerda[]>>(
    "/pipeline-vendas/motivos-perda",
  )).data),
});

const useInvalidateMotivos = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["pipeline-motivos-perda"] });
};

export const useCreatePipelineMotivoPerda = () => {
  const invalidate = useInvalidateMotivos();
  return useMutation({
    mutationFn: async (data: PipelineMotivoPerdaInput) => unwrap((await api.post<ApiResponse<PipelineMotivoPerda>>(
      "/pipeline-vendas/motivos-perda", data,
    )).data),
    onSuccess: invalidate,
  });
};

export const useUpdatePipelineMotivoPerda = () => {
  const invalidate = useInvalidateMotivos();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PipelineMotivoPerdaInput }) => unwrap((await api.put<ApiResponse<PipelineMotivoPerda>>(
      `/pipeline-vendas/motivos-perda/${id}`, data,
    )).data),
    onSuccess: invalidate,
  });
};
