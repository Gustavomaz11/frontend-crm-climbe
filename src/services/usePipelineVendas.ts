import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

type PipelineResultado = "ABERTO" | "GANHO" | "PERDIDO";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PipelineNegocio {
  id: number;
  funilId: number;
  funilNome: string;
  empresaId?: number | null;
  nomeEmpresa: string;
  nomeContato: string;
  telefone: string;
  email: string;
  responsavelId: number;
  responsavelNome: string;
  etapaId: number;
  etapaCodigo: string;
  etapaNome: string;
  dataReuniao?: string | null;
  origemNegocio: string;
  estrategiaComercial: string;
  servicoInteresse: string;
  servicosInteresse?: string[];
  valorEstimadoProposta?: number | null;
  observacoes?: string | null;
  resultado: PipelineResultado;
  motivoPerdaId?: number | null;
  motivoPerdaNome?: string | null;
  observacaoPerda?: string | null;
  encerradoEm?: string | null;
  contratoId?: number | null;
  possuiProposta: boolean;
  propostaAjustesPendentes: boolean;
  criadoEm: string;
  ultimaMovimentacaoEm: string;
}

export interface PipelineEtapa {
  id: number;
  codigo: string;
  nome: string;
  posicao: number;
  resultado: PipelineResultado;
  objetivo?: string | null;
  criteriosConclusao?: string | null;
  tempoMaximoPermanenciaDias?: number | null;
  camposObrigatorios: string[];
  negocios: PipelineNegocio[];
}

export interface PipelineBoard {
  funilId: number;
  funilNome: string;
  etapas: PipelineEtapa[];
}

export interface PipelineNegocioInput {
  funilId?: number | null;
  empresaId?: number | null;
  cadastrarEmpresa?: boolean;
  cnpj?: string | null;
  nomeEmpresa: string;
  nomeContato: string;
  telefone: string;
  email: string;
  responsavelId: number;
  etapaId?: number | null;
  dataReuniao?: string | null;
  origemNegocio: string;
  estrategiaComercial: string;
  servicoInteresse: string;
  servicosInteresse: string[];
  valorEstimadoProposta?: number | null;
  observacoes?: string | null;
}

export const movePipelineNegocioInBoard = (
  board: PipelineBoard,
  negocioId: number,
  etapaId: number,
): PipelineBoard => {
  const destination = board.etapas.find((stage) => stage.id === etapaId);
  const business = board.etapas
    .flatMap((stage) => stage.negocios)
    .find((item) => item.id === negocioId);

  if (!destination || !business || business.etapaId === etapaId) return board;

  const movedBusiness: PipelineNegocio = {
    ...business,
    etapaId: destination.id,
    etapaCodigo: destination.codigo,
    etapaNome: destination.nome,
    resultado: destination.resultado,
    ...(destination.resultado === "ABERTO" ? {
      motivoPerdaId: null,
      motivoPerdaNome: null,
      observacaoPerda: null,
      encerradoEm: null,
    } : {}),
  };

  return {
    ...board,
    etapas: board.etapas.map((stage) => ({
      ...stage,
      negocios: stage.id === etapaId
        ? [...stage.negocios.filter((item) => item.id !== negocioId), movedBusiness]
        : stage.negocios.filter((item) => item.id !== negocioId),
    })),
  };
};

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message || error.message;
  }
  return error instanceof Error ? error.message : "Erro ao processar o negócio";
};

const unwrap = <T,>(response: ApiResponse<T>) => {
  if (!response.success) throw new Error(response.message || "Erro na API");
  return response.data;
};

const useInvalidatePipeline = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["pipeline-vendas"] });
};

export const usePipelineVendas = (funilId?: number | null) => useQuery<PipelineBoard>({
  queryKey: ["pipeline-vendas", funilId],
  refetchInterval: 60_000,
  queryFn: async () => unwrap((await api.get<ApiResponse<PipelineBoard>>("/pipeline-vendas", {
    params: { funilId: funilId || undefined },
  })).data),
});

export const useCreatePipelineNegocio = () => {
  const invalidate = useInvalidatePipeline();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PipelineNegocioInput) => {
      try {
        return unwrap((await api.post<ApiResponse<PipelineNegocio>>("/pipeline-vendas/negocios", data)).data);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: async (_negocio, variables) => {
      await invalidate();
      if (variables.cadastrarEmpresa) {
        await queryClient.invalidateQueries({ queryKey: ["empresas"] });
      }
    },
  });
};

export const useUpdatePipelineNegocio = () => {
  const invalidate = useInvalidatePipeline();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PipelineNegocioInput }) => {
      try {
        return unwrap((await api.put<ApiResponse<PipelineNegocio>>(`/pipeline-vendas/negocios/${id}`, data)).data);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: invalidate,
  });
};

export const useMovePipelineNegocio = () => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidatePipeline();
  return useMutation({
    mutationFn: async ({ id, etapaId, motivoPerdaId, observacaoPerda }: {
      id: number; etapaId: number; motivoPerdaId?: number; observacaoPerda?: string;
    }) => {
      try {
        return unwrap((await api.patch<ApiResponse<PipelineNegocio>>(
          `/pipeline-vendas/negocios/${id}/etapa`,
          { etapaId, motivoPerdaId, observacaoPerda },
        )).data);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onMutate: async ({ id, etapaId }) => {
      await queryClient.cancelQueries({ queryKey: ["pipeline-vendas"] });
      const previousBoards = queryClient.getQueriesData<PipelineBoard>({
        queryKey: ["pipeline-vendas"],
      });
      queryClient.setQueriesData<PipelineBoard>(
        { queryKey: ["pipeline-vendas"] },
        (current) => current ? movePipelineNegocioInBoard(current, id, etapaId) : current,
      );
      return { previousBoards };
    },
    onError: (_error, _variables, context) => {
      context?.previousBoards.forEach(([queryKey, previousBoard]) => {
        queryClient.setQueryData(queryKey, previousBoard);
      });
    },
    onSettled: invalidate,
  });
};

export const useConcludePipelineNegocio = () => {
  const invalidate = useInvalidatePipeline();
  return useMutation({
    mutationFn: async ({ id, resultado, motivoPerdaId, observacaoPerda }: {
      id: number; resultado: Exclude<PipelineResultado, "ABERTO">;
      motivoPerdaId?: number; observacaoPerda?: string;
    }) => {
      const action = resultado === "GANHO" ? "ganhar" : "perder";
      try {
        return unwrap((await api.patch<ApiResponse<PipelineNegocio>>(
          `/pipeline-vendas/negocios/${id}/${action}`,
          resultado === "PERDIDO" ? { motivoPerdaId, observacaoPerda } : {},
        )).data);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: invalidate,
  });
};

export const useReactivatePipelineNegocio = () => {
  const invalidate = useInvalidatePipeline();
  return useMutation({
    mutationFn: async ({ id, etapaId }: { id: number; etapaId?: number | null }) => {
      try {
        return unwrap((await api.patch<ApiResponse<PipelineNegocio>>(
          `/pipeline-vendas/negocios/${id}/reativar`,
          etapaId ? { etapaId } : {},
        )).data);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: invalidate,
  });
};

export const useConvertPipelineNegocio = () => {
  const invalidate = useInvalidatePipeline();
  return useMutation({
    mutationFn: async ({ id, empresaId }: { id: number; empresaId: number }) => {
      try {
        return unwrap((await api.post<ApiResponse<PipelineNegocio>>(
          `/pipeline-vendas/negocios/${id}/converter-contrato`,
          { empresaId },
        )).data);
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: async () => {
      await invalidate();
    },
  });
};
