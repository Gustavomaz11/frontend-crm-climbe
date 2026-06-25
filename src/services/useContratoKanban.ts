import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

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
}

export interface ContratoKanbanTask {
  id: number;
  raiaId: number;
  titulo: string;
  descricao?: string | null;
  responsavel?: UsuarioResumo | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  posicao: number;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface ContratoKanbanRaia {
  id: number;
  titulo: string;
  posicao: number;
  criadoEm?: string;
  atualizadoEm?: string;
  tasks: ContratoKanbanTask[];
}

export interface ContratoKanbanBoard {
  contratoId: number;
  contratoTitulo?: string | null;
  gestor: boolean;
  responsavel?: UsuarioResumo | null;
  participantes: UsuarioResumo[];
  raias: ContratoKanbanRaia[];
}

export interface KanbanRaiaDTO {
  titulo: string;
  posicao?: number;
}

export interface KanbanTaskDTO {
  raiaId: number;
  titulo: string;
  descricao?: string;
  responsavelId?: number | null;
  dataInicio?: string;
  dataFim?: string;
  posicao?: number;
}

export interface MoveKanbanTaskDTO {
  raiaId: number;
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

export function useContratoKanban(contratoId?: number) {
  return useQuery<ContratoKanbanBoard>({
    queryKey: ["contratos", contratoId, "kanban"],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<ContratoKanbanBoard>>(`/contratos/${contratoId}/kanban`);
      return unwrap(response.data);
    },
    enabled: !!contratoId,
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
      queryClient.invalidateQueries({ queryKey: ["contratos", variables.contratoId, "kanban"] });
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
      queryClient.invalidateQueries({ queryKey: ["contratos", variables.contratoId, "kanban"] });
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
      queryClient.invalidateQueries({ queryKey: ["contratos", variables.contratoId, "kanban"] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos", variables.contratoId, "kanban"] });
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
      queryClient.invalidateQueries({ queryKey: ["contratos", variables.contratoId, "kanban"] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos", variables.contratoId, "kanban"] });
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
      queryClient.invalidateQueries({ queryKey: ["contratos", variables.contratoId, "kanban"] });
    },
  });
}
