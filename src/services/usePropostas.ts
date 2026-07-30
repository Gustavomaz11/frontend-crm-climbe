import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";
import type { CommercialService } from "./commercialProposal";

export interface PropostaReajuste {
  mesVigencia: number;
  valor: number;
}

export interface PropostaCommercialConfig {
  servico: CommercialService;
  mesInicio?: string | null;
  recorrenciaMeses?: number | null;
  quantidadeParcelas?: number | null;
  parcelasIguais: boolean;
  comissaoTecnicoPercentual?: number | null;
  comissaoComercialPercentual?: number | null;
  equipeTecnicaIds: number[];
  equipeComercialIds: number[];
  reajustes: PropostaReajuste[];
  observacoes?: string | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type PropostaStatus = "PENDENTE" | "APROVADA" | "REJEITADA";

export interface PropostaApi {
  idProposta: number;
  empresaId: number;
  usuarioId: number;
  url: string;
  valuation: number | null;
  status: PropostaStatus;
  dataCriacao: string;
  servico?: CommercialService | null;
  mesInicio?: string | null;
  recorrenciaMeses?: number | null;
  quantidadeParcelas?: number | null;
  parcelasIguais?: boolean;
  comissaoTecnicoPercentual?: number | null;
  comissaoComercialPercentual?: number | null;
  equipeTecnicaIds?: number[];
  equipeComercialIds?: number[];
  reajustes?: PropostaReajuste[];
  observacoes?: string | null;
}

export interface HistoricoAprovacaoProposta {
  idHistorico: number;
  propostaId: number;
  usuarioId: number;
  usuarioNome?: string | null;
  statusAnterior: PropostaStatus;
  statusNovo: PropostaStatus;
  dataAlteracao: string;
}

export function getPropostaFileNameFromUrl(url?: string | null) {
  if (!url) return "Proposta sem arquivo";
  const rawFileName = url.split(/[?#]/)[0].split("/").pop() || url;
  const fileName = decodeURIComponent(rawFileName);
  return fileName.replace(/^[0-9a-fA-F-]{36}_/, "");
}

interface CreatePropostaWithFileDTO {
  file: File;
  empresaId: number;
  valuation: number;
  configuracao: PropostaCommercialConfig;
}

interface UpdatePropostaStatusDTO {
  id: number;
  status: Exclude<PropostaStatus, "PENDENTE">;
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

export function usePropostas() {
  return useQuery<PropostaApi[]>({
    queryKey: ["propostas"],
    queryFn: async () => {
      const response = await api.get<ApiEnvelope<PropostaApi[]> | PropostaApi[]>("/propostas");
      return unwrap(response.data);
    },
  });
}

export async function getPropostaDownloadUrl(id: number) {
  try {
    const response = await api.get<ApiEnvelope<string>>(`/propostas/${id}/download-url`);
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getPropostaHistorico(id: number) {
  try {
    const response = await api.get<ApiEnvelope<HistoricoAprovacaoProposta[]>>(`/propostas/${id}/historico`);
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export function useCreatePropostaWithFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, empresaId, valuation, configuracao }: CreatePropostaWithFileDTO) => {
      try {
        const formData = new FormData();
        formData.append("arquivo", file);
        formData.append("empresaId", String(empresaId));
        formData.append("valuation", valuation.toFixed(2));
        formData.append("configuracao", new Blob([JSON.stringify(configuracao)], { type: "application/json" }));

        const response = await api.post<ApiEnvelope<PropostaApi>>("/propostas/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
    },
  });
}

export function useUpdatePropostaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdatePropostaStatusDTO) => {
      try {
        const response = await api.patch<ApiEnvelope<PropostaApi>>(`/propostas/${id}/aprovar`, { status });
        return unwrap(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
    },
  });
}
