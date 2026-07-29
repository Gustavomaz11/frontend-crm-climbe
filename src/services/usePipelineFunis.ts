import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PipelineFunilResumo {
  id: number;
  nome: string;
  descricao?: string | null;
  estrategia: string;
  posicao: number;
  ativo: boolean;
}

export interface PipelineEtapaConfiguracao {
  id?: number;
  nome: string;
  objetivo?: string | null;
  criteriosConclusao?: string | null;
  posicao?: number;
  tempoMaximoPermanenciaDias?: number | null;
  sucesso: boolean;
  perda: boolean;
  camposObrigatorios: string[];
  ativo: boolean;
}

export interface PipelineFunil extends PipelineFunilResumo {
  etapas: PipelineEtapaConfiguracao[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface PipelineFunilInput {
  nome: string;
  descricao?: string | null;
  estrategia: string;
  ativo: boolean;
  etapas: PipelineEtapaConfiguracao[];
}

const unwrap = <T,>(response: ApiResponse<T>) => {
  if (!response.success) throw new Error(response.message || "Erro na API");
  return response.data;
};

const errorMessage = (error: unknown) => {
  if (isAxiosError<ApiResponse<unknown>>(error)) return error.response?.data?.message || error.message;
  return error instanceof Error ? error.message : "Erro ao configurar funil";
};

const useInvalidateFunnels = () => {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["pipeline-funis"] }),
      queryClient.invalidateQueries({ queryKey: ["pipeline-vendas"] }),
    ]);
  };
};

export const usePipelineFunisAtivos = () => useQuery({
  queryKey: ["pipeline-funis", "ativos"],
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineFunilResumo[]>>(
    "/pipeline-vendas/funis/ativos",
  )).data),
});

export const usePipelineFunisAdmin = (enabled = true) => useQuery({
  queryKey: ["pipeline-funis", "admin"],
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineFunil[]>>(
    "/pipeline-vendas/funis",
  )).data),
  enabled,
});

export const useCreatePipelineFunil = () => {
  const invalidate = useInvalidateFunnels();
  return useMutation({
    mutationFn: async (data: PipelineFunilInput) => {
      try {
        return unwrap((await api.post<ApiResponse<PipelineFunil>>("/pipeline-vendas/funis", data)).data);
      } catch (error) {
        throw new Error(errorMessage(error));
      }
    },
    onSuccess: invalidate,
  });
};

export const useUpdatePipelineFunil = () => {
  const invalidate = useInvalidateFunnels();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PipelineFunilInput }) => {
      try {
        return unwrap((await api.put<ApiResponse<PipelineFunil>>(`/pipeline-vendas/funis/${id}`, data)).data);
      } catch (error) {
        throw new Error(errorMessage(error));
      }
    },
    onSuccess: invalidate,
  });
};

export const useDuplicatePipelineFunil = () => {
  const invalidate = useInvalidateFunnels();
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return unwrap((await api.post<ApiResponse<PipelineFunil>>(`/pipeline-vendas/funis/${id}/duplicar`)).data);
      } catch (error) {
        throw new Error(errorMessage(error));
      }
    },
    onSuccess: invalidate,
  });
};

export const useReorderPipelineFunis = () => {
  const invalidate = useInvalidateFunnels();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      try {
        return unwrap((await api.patch<ApiResponse<PipelineFunil[]>>("/pipeline-vendas/funis/ordem", { ids })).data);
      } catch (error) {
        throw new Error(errorMessage(error));
      }
    },
    onSuccess: invalidate,
  });
};
