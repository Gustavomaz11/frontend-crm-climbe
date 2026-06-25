import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";
import { getPropostaFileNameFromUrl } from "./usePropostas";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  detail?: string;
  error?: string;
}

export type ContratoStatus = "PENDENTE" | "APROVADO" | "REJEITADO" | string;

interface ContratoApi {
  idContrato?: number;
  id?: number;
  proposta?: {
    idProposta?: number;
    url?: string;
  } | null;
  usuario?: {
    id?: number;
    nomeCompleto?: string;
  } | null;
  responsavel?: {
    id?: number;
    nomeCompleto?: string;
    email?: string;
  } | null;
  participantes?: Array<{
    id?: number;
    nomeCompleto?: string;
    email?: string;
  }>;
  empresa?: {
    idEmpresa?: number;
    id?: number;
    nomeFantasia?: string;
    nome?: string;
  } | null;
  empresaNomeFantasia?: string;
  dataInicio?: string;
  dataFim?: string;
  urlPdf?: string;
  status?: string;
}

export interface Contrato {
  id: number;
  titulo: string;
  descricao: string;
  status: ContratoStatus;
  dataInicio: string;
  dataFim: string;
  valor: number;
  empresaId: number;
  empresaNome: string;
  propostaId?: number | null;
  propostaTitulo?: string | null;
  responsavelId?: number | null;
  responsavelNome?: string | null;
  participantes: Array<{
    id: number;
    nomeCompleto: string;
    email?: string;
  }>;
  urlPdf?: string | null;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface HistoricoAprovacaoContrato {
  idHistorico: number;
  contratoId: number;
  usuarioId: number;
  usuarioNome?: string | null;
  statusAnterior: string;
  statusNovo: string;
  dataAlteracao: string;
}

interface CreateContratoWithFileDTO {
  file: File;
  empresaId: number;
  propostaId?: number | null;
  responsavelId: number;
  participanteIds: number[];
}

interface UpdateContratoStatusDTO {
  id: number;
  status: "APROVADO" | "REJEITADO";
}

interface UpdateContratoResponsaveisDTO {
  id: number;
  responsavelId: number;
  participanteIds: number[];
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

function getFileNameFromUrl(url?: string | null) {
  if (!url) return "Contrato sem arquivo";
  const fileName = decodeURIComponent(url.split("/").pop() || url);
  return fileName.replace(/^[0-9a-fA-F-]{36}_/, "");
}

function normalizeContrato(contrato: ContratoApi): Contrato {
  const id = contrato.id ?? contrato.idContrato ?? 0;
  const empresaId = contrato.empresa?.idEmpresa ?? contrato.empresa?.id ?? 0;
  const empresaNome =
    contrato.empresaNomeFantasia ??
    contrato.empresa?.nomeFantasia ??
    contrato.empresa?.nome ??
    (empresaId ? `Empresa #${empresaId}` : "Empresa nao informada");

  return {
    id,
    titulo: getFileNameFromUrl(contrato.urlPdf),
    descricao: contrato.proposta?.idProposta
      ? `Contrato vinculado a ${getPropostaFileNameFromUrl(contrato.proposta.url)}`
      : "Contrato sem proposta vinculada",
    status: contrato.status ?? "PENDENTE",
    dataInicio: contrato.dataInicio ?? "",
    dataFim: contrato.dataFim ?? "",
    valor: 0,
    empresaId,
    empresaNome,
    propostaId: contrato.proposta?.idProposta ?? null,
    propostaTitulo: contrato.proposta?.idProposta
      ? getPropostaFileNameFromUrl(contrato.proposta.url)
      : null,
    responsavelId: contrato.responsavel?.id ?? null,
    responsavelNome: contrato.responsavel?.nomeCompleto ?? null,
    participantes: (contrato.participantes ?? [])
      .filter((participante) => participante.id)
      .map((participante) => ({
        id: participante.id ?? 0,
        nomeCompleto: participante.nomeCompleto ?? `Usuário #${participante.id}`,
        email: participante.email,
      })),
    urlPdf: contrato.urlPdf ?? null,
    dataCriacao: contrato.dataInicio ?? "",
    dataAtualizacao: "",
  };
}

export function useContratos() {
  return useQuery<Contrato[]>({
    queryKey: ["contratos"],
    queryFn: async () => {
      const response = await api.get<ContratoApi[]>("/contratos");
      return response.data.map(normalizeContrato);
    },
  });
}

export function useContratoById(id: number) {
  return useQuery<Contrato>({
    queryKey: ["contratos", id],
    queryFn: async () => {
      const response = await api.get<ContratoApi>(`/contratos/${id}`);
      return normalizeContrato(response.data);
    },
    enabled: !!id,
  });
}

export function useContratosByStatus(status: string) {
  return useQuery<Contrato[]>({
    queryKey: ["contratos", "status", status],
    queryFn: async () => {
      const response = await api.get<ContratoApi[]>(`/contratos/status/${status}`);
      return response.data.map(normalizeContrato);
    },
    enabled: !!status,
  });
}

export async function getContratoDownloadUrl(id: number) {
  try {
    const response = await api.get<ApiEnvelope<string>>(`/contratos/${id}/download-url`);
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getContratoHistorico(id: number) {
  try {
    const response = await api.get<ApiEnvelope<HistoricoAprovacaoContrato[]>>(`/contratos/${id}/historico`);
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export function useCreateContratoWithFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, empresaId, propostaId, responsavelId, participanteIds }: CreateContratoWithFileDTO) => {
      try {
        const formData = new FormData();
        formData.append("arquivo", file);
        formData.append("empresaId", String(empresaId));
        formData.append("responsavelId", String(responsavelId));
        participanteIds.forEach((participanteId) => {
          formData.append("participanteIds", String(participanteId));
        });
        if (propostaId) {
          formData.append("propostaId", String(propostaId));
        }

        const response = await api.post<ContratoApi>("/contratos/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        return normalizeContrato(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}

export function useUpdateContratoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdateContratoStatusDTO) => {
      try {
        const response = await api.patch<ContratoApi>(`/contratos/${id}/aprovar`, { status });
        return normalizeContrato(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}

export function useUpdateContratoResponsaveis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, responsavelId, participanteIds }: UpdateContratoResponsaveisDTO) => {
      try {
        const response = await api.patch<ContratoApi>(`/contratos/${id}/responsaveis`, {
          responsavelId,
          participanteIds,
        });
        return normalizeContrato(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["contratos", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["contratos", variables.id, "kanban"] });
    },
  });
}

export function useDesvincularPropostaContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        const response = await api.patch<ContratoApi>(`/contratos/${id}/desvincular-proposta`);
        return normalizeContrato(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
    },
  });
}

export function useDeleteContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/contratos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}
