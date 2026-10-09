import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";
import { useAuthStore } from "@/store/useAuthStore";

const usuarioAtualId = () => {
  const { basicUserData, userData } = useAuthStore.getState();
  return basicUserData?.id ?? userData?.id;
};
const boardQueryKey = (contratoId?: number, usuarioId = usuarioAtualId()) =>
  usuarioId ? ["contratos", contratoId, "kanban", usuarioId] : ["contratos", contratoId, "kanban"];

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  detail?: string;
  error?: string;
}

export interface UsuarioResumo {
  id: number;
  nomeCompleto: string;
  email?: string;
  cargo?: string | null;
  cargoNome?: string | null;
  fotoPerfil?: string | null;
}

export type KanbanTaskPrioridade = "BAIXA" | "MEDIA" | "ALTA";

export interface ContratoKanbanSubtarefa {
  responsavel?: UsuarioResumo | null;
  id: number;
  titulo: string;
  concluida: boolean;
  posicao: number;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface ContratoKanbanTask {
  responsaveis?: UsuarioResumo[];
  id: number;
  raiaId: number;
  titulo: string;
  descricao?: string | null;
  prioridade: KanbanTaskPrioridade;
  responsavel?: UsuarioResumo | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  posicao: number;
  criadoEm?: string;
  atualizadoEm?: string;
  subtarefas: ContratoKanbanSubtarefa[];
}

export interface ContratoKanbanRaia {
  concluiTarefas?: boolean;
  id: number;
  titulo: string;
  posicao: number;
  criadoEm?: string;
  atualizadoEm?: string;
  tasks: ContratoKanbanTask[];
}

export interface ContratoKanbanBoard {
  podeEditar?: boolean;
  contratoId: number;
  contratoTitulo?: string | null;
  gestor: boolean;
  responsavel?: UsuarioResumo | null;
  participantes: UsuarioResumo[];
  usuariosDisponiveis: UsuarioResumo[];
  raias: ContratoKanbanRaia[];
}

export interface KanbanRaiaDTO {
  concluiTarefas?: boolean;
  titulo: string;
  posicao?: number;
}

export interface KanbanTaskDTO {
  responsavelIds?: number[];
  raiaId: number;
  titulo: string;
  descricao?: string;
  prioridade?: KanbanTaskPrioridade;
  responsavelId?: number | null;
  dataInicio?: string;
  dataFim?: string;
  posicao?: number;
}

export interface MoveKanbanTaskDTO {
  raiaId: number;
}

export interface KanbanSubtarefaDTO {
  responsavelId?: number | null;
  titulo: string;
  concluida?: boolean;
  posicao?: number;
}

export function moveTaskInBoard(
  board: ContratoKanbanBoard,
  taskId: number,
  destinationRaiaId: number,
): ContratoKanbanBoard {
  const task = board.raias
    .flatMap((raia) => raia.tasks)
    .find((item) => item.id === taskId);

  if (!task || task.raiaId === destinationRaiaId) return board;

  return {
    ...board,
    raias: board.raias.map((raia) => ({
      ...raia,
      tasks:
        raia.id === destinationRaiaId
          ? [...raia.tasks, { ...task, raiaId: destinationRaiaId }]
          : raia.tasks.filter((item) => item.id !== taskId),
    })),
  };
}

function unwrap<T>(response: T | ApiEnvelope<T>): T {
  if (
    response &&
    typeof response === "object" &&
    "success" in response &&
    "data" in response
  ) {
    const envelope = response as ApiEnvelope<T>;
    if (!envelope.success) {
      throw new Error(envelope.message || "Erro na API");
    }
    return envelope.data;
  }

  return response as T;
}

function getApiErrorMessage(error: unknown) {
  if (isAxiosError<ApiEnvelope<unknown>>(error)) {
    return error.response?.data?.message || error.response?.data?.detail || error.response?.data?.error || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro na API";
}

export function useContratoKanban(contratoId?: number, usuarioId?: number) {
  return useQuery<ContratoKanbanBoard>({
    queryKey: boardQueryKey(contratoId, usuarioId),
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<ContratoKanbanBoard>>(`/contratos/${contratoId}/kanban`);
      return unwrap(response.data);
    },
    enabled: !!contratoId,
    retry: false,
  });
}

export function useCreateKanbanRaia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, data }: { contratoId: number; data: KanbanRaiaDTO }) => {
      try {
        const response = await api.post<ApiEnvelope<ContratoKanbanBoard>>(`/contratos/${contratoId}/kanban/raias`, data);
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useUpdateKanbanRaia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, raiaId, data }: { contratoId: number; raiaId: number; data: KanbanRaiaDTO }) => {
      try {
        const response = await api.put<ApiEnvelope<ContratoKanbanBoard>>(`/contratos/${contratoId}/kanban/raias/${raiaId}`, data);
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useDeleteKanbanRaia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, raiaId }: { contratoId: number; raiaId: number }) => {
      try {
        const response = await api.delete<ApiEnvelope<ContratoKanbanBoard>>(`/contratos/${contratoId}/kanban/raias/${raiaId}`);
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useCreateKanbanTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, data }: { contratoId: number; data: KanbanTaskDTO }) => {
      try {
        const response = await api.post<ApiEnvelope<ContratoKanbanBoard>>(`/contratos/${contratoId}/kanban/tasks`, data);
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (board, variables) => {
      const queryKey = boardQueryKey(variables.contratoId);
      queryClient.setQueryData(queryKey, board);
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useUpdateKanbanTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, taskId, data }: { contratoId: number; taskId: number; data: KanbanTaskDTO }) => {
      try {
        const response = await api.put<ApiEnvelope<ContratoKanbanBoard>>(`/contratos/${contratoId}/kanban/tasks/${taskId}`, data);
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useMoveKanbanTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, taskId, data }: { contratoId: number; taskId: number; data: MoveKanbanTaskDTO }) => {
      try {
        const response = await api.patch<ApiEnvelope<ContratoKanbanBoard>>(`/contratos/${contratoId}/kanban/tasks/${taskId}/raia`, data);
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onMutate: async (variables) => {
      const queryKey = boardQueryKey(variables.contratoId);
      await queryClient.cancelQueries({ queryKey });
      const previousBoard = queryClient.getQueryData<ContratoKanbanBoard>(queryKey);

      queryClient.setQueryData<ContratoKanbanBoard>(queryKey, (current) =>
        current
          ? moveTaskInBoard(current, variables.taskId, variables.data.raiaId)
          : current,
      );

      return { previousBoard, queryKey };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(context.queryKey, context.previousBoard);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contratos"],
      });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useDeleteKanbanTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, taskId }: { contratoId: number; taskId: number }) => {
      try {
        const response = await api.delete<ApiEnvelope<ContratoKanbanBoard>>(`/contratos/${contratoId}/kanban/tasks/${taskId}`);
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useCreateKanbanSubtarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contratoId,
      taskId,
      data,
    }: {
      contratoId: number;
      taskId: number;
      data: KanbanSubtarefaDTO;
    }) => {
      try {
        const response = await api.post<ApiEnvelope<ContratoKanbanBoard>>(
          `/contratos/${contratoId}/kanban/tasks/${taskId}/subtasks`,
          data,
        );
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useUpdateKanbanSubtarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contratoId,
      taskId,
      subtarefaId,
      data,
    }: {
      contratoId: number;
      taskId: number;
      subtarefaId: number;
      data: KanbanSubtarefaDTO;
    }) => {
      try {
        const response = await api.put<ApiEnvelope<ContratoKanbanBoard>>(
          `/contratos/${contratoId}/kanban/tasks/${taskId}/subtasks/${subtarefaId}`,
          data,
        );
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useToggleKanbanSubtarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contratoId,
      taskId,
      subtarefaId,
      concluida,
    }: {
      contratoId: number;
      taskId: number;
      subtarefaId: number;
      concluida: boolean;
    }) => {
      try {
        const response = await api.patch<ApiEnvelope<ContratoKanbanBoard>>(
          `/contratos/${contratoId}/kanban/tasks/${taskId}/subtasks/${subtarefaId}/conclusao`,
          { concluida },
        );
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useDeleteKanbanSubtarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contratoId,
      taskId,
      subtarefaId,
    }: {
      contratoId: number;
      taskId: number;
      subtarefaId: number;
    }) => {
      try {
        const response = await api.delete<ApiEnvelope<ContratoKanbanBoard>>(
          `/contratos/${contratoId}/kanban/tasks/${taskId}/subtasks/${subtarefaId}`,
        );
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}
