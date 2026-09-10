import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type PipelineTarefaPrioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
export type PipelineTarefaStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
export type PipelineTarefaVisao = "TODAS" | "HOJE" | "ATRASADAS" | "FUTURAS" | "CONCLUIDAS";

export interface PipelineSubtarefa {
  id?: number;
  titulo: string;
  concluida: boolean;
  posicao: number;
}

export interface PipelineTarefa {
  campanhaId?: number; campanhaNome?: string; contato?: string; telefone?: string; email?: string; motivoCancelamento?: string; comentarioCancelamento?: string; canceladoEm?: string;
  id: number;
  negocioId: number;
  negocioNome: string;
  titulo: string;
  descricao?: string | null;
  responsavelId: number;
  responsavelNome: string;
  dataInicio?: string | null;
  prazo?: string | null;
  prioridade: PipelineTarefaPrioridade;
  status: PipelineTarefaStatus;
  tipo: string;
  observacoes?: string | null;
  subtarefas: PipelineSubtarefa[];
  criadoEm: string;
  atualizadoEm: string;
  concluidoEm?: string | null;
}

export interface PipelineTarefaInput {
  titulo: string;
  descricao?: string | null;
  responsavelId: number;
  dataInicio?: string | null;
  prazo: string;
  prioridade: PipelineTarefaPrioridade;
  status: PipelineTarefaStatus;
  tipo: string;
  observacoes?: string | null;
  subtarefas: Omit<PipelineSubtarefa, "id">[];
}

export interface PipelineTarefaFiltros {
  visao: PipelineTarefaVisao;
  funilId?: number | null;
  responsavelId?: number | null;
  negocioId?: number | null;
  tipo?: string;
}

export interface PipelineComentario {
  id: number;
  comentarioPaiId?: number | null;
  autorId: number;
  autorNome: string;
  conteudo: string;
  criadoEm: string;
}

export interface PipelineHistorico {
  id: number;
  tipo: string;
  descricao: string;
  usuarioId: number;
  usuarioNome: string;
  criadoEm: string;
}

const unwrap = <T,>(response: ApiResponse<T>) => {
  if (!response.success) throw new Error(response.message || "Erro na API");
  return response.data;
};

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message || error.message;
  }
  return error instanceof Error ? error.message : "Erro ao processar a atividade";
};

const useInvalidateAtividades = () => {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["pipeline-atividades"] }),
      queryClient.invalidateQueries({ queryKey: ["pipeline-vendas"] }),
      queryClient.invalidateQueries({ queryKey: ["pipeline-campaigns"] }),
      queryClient.invalidateQueries({ queryKey: ["pipeline-dashboard"] }),
    ]);
  };
};

export const usePipelineTarefas = (filtros: PipelineTarefaFiltros, enabled = true) => useQuery({
  queryKey: ["pipeline-atividades", "tarefas", filtros],
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineTarefa[]>>("/pipeline-vendas/tarefas", {
    params: {
      visao: filtros.visao,
      funilId: filtros.funilId || undefined,
      responsavelId: filtros.responsavelId || undefined,
      negocioId: filtros.negocioId || undefined,
      tipo: filtros.tipo || undefined,
    },
  })).data),
  enabled,
});

export const useNegocioTarefas = (negocioId?: number, enabled = true) => useQuery({
  queryKey: ["pipeline-atividades", "negocio", negocioId, "tarefas"],
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineTarefa[]>>(
    `/pipeline-vendas/negocios/${negocioId}/tarefas`,
  )).data),
  enabled: enabled && !!negocioId,
});

export const useCreatePipelineTarefa = () => {
  const invalidate = useInvalidateAtividades();
  return useMutation({
    mutationFn: async ({ negocioId, data }: { negocioId: number; data: PipelineTarefaInput }) => {
      try {
        return unwrap((await api.post<ApiResponse<PipelineTarefa>>(
          `/pipeline-vendas/negocios/${negocioId}/tarefas`, data,
        )).data);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: invalidate,
  });
};

export const useUpdatePipelineTarefa = () => {
  const invalidate = useInvalidateAtividades();
  return useMutation({
    mutationFn: async ({ tarefaId, data }: { tarefaId: number; data: PipelineTarefaInput }) => {
      try {
        return unwrap((await api.put<ApiResponse<PipelineTarefa>>(
          `/pipeline-vendas/tarefas/${tarefaId}`, data,
        )).data);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: invalidate,
  });
};

export const useSetPipelineTarefaStatus = () => {
  const invalidate = useInvalidateAtividades();
  return useMutation({
    mutationFn: async ({ tarefaId, status }: { tarefaId: number; status: PipelineTarefaStatus }) => {
      try {
        return unwrap((await api.patch<ApiResponse<PipelineTarefa>>(
          `/pipeline-vendas/tarefas/${tarefaId}/status`, { status },
        )).data);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: invalidate,
  });
};

export const usePipelineComentarios = (negocioId?: number, enabled = true) => useQuery({
  queryKey: ["pipeline-atividades", "negocio", negocioId, "comentarios"],
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineComentario[]>>(
    `/pipeline-vendas/negocios/${negocioId}/comentarios`,
  )).data),
  enabled: enabled && !!negocioId,
});

export const useCreatePipelineComentario = () => {
  const invalidate = useInvalidateAtividades();
  return useMutation({
    mutationFn: async ({ negocioId, conteudo, comentarioPaiId }: {
      negocioId: number;
      conteudo: string;
      comentarioPaiId?: number | null;
    }) => {
      try {
        return unwrap((await api.post<ApiResponse<PipelineComentario>>(
          `/pipeline-vendas/negocios/${negocioId}/comentarios`, { conteudo, comentarioPaiId },
        )).data);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: invalidate,
  });
};

export const usePipelineHistorico = (negocioId?: number, enabled = true) => useQuery({
  queryKey: ["pipeline-atividades", "negocio", negocioId, "historico"],
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineHistorico[]>>(
    `/pipeline-vendas/negocios/${negocioId}/historico`,
  )).data),
  enabled: enabled && !!negocioId,
});
