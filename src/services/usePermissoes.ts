import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PermissaoApi {
  id?: number;
  idPermissao?: number;
  codigo: string;
  nome?: string;
  descricao?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface Permissao {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

interface UsuarioPermissaoApi {
  id: number;
  usuario?: {
    id: number;
    nomeCompleto?: string;
    email?: string;
  };
  permissao?: PermissaoApi;
}

export interface UsuarioPermissaoAssociacao {
  id: number;
  usuarioId: number;
  permissao: Permissao;
}

interface CreatePermissaoDTO {
  codigo: string;
  nome: string;
  descricao: string;
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
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro na API";
}

function humanizeCodigo(codigo: string) {
  return codigo
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizePermissao(permissao: PermissaoApi): Permissao {
  const id = permissao.id ?? permissao.idPermissao ?? 0;
  return {
    id,
    codigo: permissao.codigo,
    nome: permissao.nome || permissao.descricao || humanizeCodigo(permissao.codigo),
    descricao: permissao.descricao || "",
    dataCriacao: permissao.dataCriacao,
    dataAtualizacao: permissao.dataAtualizacao,
  };
}

function normalizeAssociacao(associacao: UsuarioPermissaoApi): UsuarioPermissaoAssociacao {
  return {
    id: associacao.id,
    usuarioId: associacao.usuario?.id ?? 0,
    permissao: normalizePermissao(associacao.permissao ?? { id: 0, codigo: "DESCONHECIDA" }),
  };
}

export function usePermissoes() {
  return useQuery<Permissao[]>({
    queryKey: ["permissoes"],
    queryFn: async () => {
      const response = await api.get<PermissaoApi[]>("/permissoes");
      return response.data.map(normalizePermissao);
    },
  });
}

export function usePermissaoById(id: number) {
  return useQuery<Permissao>({
    queryKey: ["permissoes", id],
    queryFn: async () => {
      const response = await api.get<PermissaoApi>(`/permissoes/${id}`);
      return normalizePermissao(response.data);
    },
    enabled: !!id,
  });
}

export function useCreatePermissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePermissaoDTO) => {
      const response = await api.post<PermissaoApi>("/permissoes", data);
      return normalizePermissao(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissoes"] });
    },
  });
}

export function useUpdatePermissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreatePermissaoDTO> }) => {
      const response = await api.put<PermissaoApi>(`/permissoes/${id}`, data);
      return normalizePermissao(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissoes"] });
    },
  });
}

export function useDeletePermissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/permissoes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissoes"] });
    },
  });
}

export function useUsuarioPermissoes(usuarioId?: number) {
  return useQuery<UsuarioPermissaoAssociacao[]>({
    queryKey: ["usuario-permissoes", usuarioId],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<UsuarioPermissaoApi[]> | UsuarioPermissaoApi[]>(
        `/usuario-permissoes/usuario/${usuarioId}`,
      );
      return unwrap(response.data).map(normalizeAssociacao);
    },
    enabled: !!usuarioId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUsuarioPermissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ usuarioId, permissaoId }: { usuarioId: number; permissaoId: number; invalidate?: boolean }) => {
      try {
        const response = await api.post<ApiEnvelope<UsuarioPermissaoApi>>("/usuario-permissoes", {
          usuarioId,
          permissaoId,
        });
        return normalizeAssociacao(unwrap(response.data));
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      if (variables.invalidate !== false) {
        queryClient.invalidateQueries({ queryKey: ["usuario-permissoes", variables.usuarioId] });
        queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      }
    },
  });
}

export function useDeleteUsuarioPermissao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ associacaoId }: { associacaoId: number; usuarioId: number; invalidate?: boolean }) => {
      try {
        await api.delete(`/usuario-permissoes/${associacaoId}`);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      if (variables.invalidate !== false) {
        queryClient.invalidateQueries({ queryKey: ["usuario-permissoes", variables.usuarioId] });
        queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      }
    },
  });
}

export function useTemPermissao(usuarioId: number, permissao: string) {
  return useQuery<boolean>({
    queryKey: ["usuario-permissoes", usuarioId, "tem-permissao", permissao],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<boolean> | boolean>(
        `/rbac/usuario/${usuarioId}/tem-permissao/${permissao}`,
      );
      return unwrap(response.data);
    },
    enabled: !!usuarioId && !!permissao,
  });
}
