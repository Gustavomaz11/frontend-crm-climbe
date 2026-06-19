import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

export type DocumentoStatus = "PENDENTE" | "EM_ANALISE" | "APROVADO" | "REPROVADO";

interface DocumentoApi {
  id: number;
  empresaId: number;
  nomeEmpresa?: string | null;
  titulo?: string | null;
  tipoDocumento?: string | null;
  url?: string | null;
  validado?: DocumentoStatus | null;
  analistaId?: number | null;
  nomeAnalista?: string | null;
  emailDestinatario?: string | null;
  tokenExpiraEm?: string | null;
  dataSolicitacao?: string | null;
  dataEnvio?: string | null;
}

export interface Documento {
  id: number;
  nome: string;
  titulo: string;
  descricao: string;
  tipo: string;
  tipoDocumento: string;
  caminho: string;
  url?: string | null;
  status: DocumentoStatus;
  validado: DocumentoStatus;
  dataUpload: string;
  dataSolicitacao?: string | null;
  dataEnvio?: string | null;
  usuarioId: number;
  analistaId?: number | null;
  nomeAnalista?: string | null;
  empresaId: number;
  nomeEmpresa?: string | null;
  emailDestinatario?: string | null;
  tokenExpiraEm?: string | null;
}

export interface DocumentoUploadInfo {
  id: number;
  titulo: string;
  tipoDocumento?: string | null;
  empresaId: number;
  nomeEmpresa?: string | null;
  tokenExpiraEm?: string | null;
}

interface CreateDocumentoDTO {
  nome: string;
  descricao: string;
  tipo: string;
  caminho: string;
  usuarioId: number;
  empresaId: number;
}

export interface SolicitarDocumentoDTO {
  empresaId: number;
  titulo: string;
  tipoDocumento?: string;
  emailDestinatario: string;
}

interface ValidarDocumentoDTO {
  id: number;
  status: Extract<DocumentoStatus, "APROVADO" | "REPROVADO">;
}

function normalizeDocumento(documento: DocumentoApi): Documento {
  const titulo = documento.titulo || documento.tipoDocumento || `Documento #${documento.id}`;
  const status = documento.validado || "PENDENTE";
  const dataUpload = documento.dataEnvio || documento.dataSolicitacao || new Date().toISOString();

  return {
    id: documento.id,
    nome: titulo,
    titulo,
    descricao: documento.nomeEmpresa ? `Documento solicitado para ${documento.nomeEmpresa}` : "Documento solicitado",
    tipo: documento.tipoDocumento || titulo,
    tipoDocumento: documento.tipoDocumento || titulo,
    caminho: documento.url || "",
    url: documento.url,
    status,
    validado: status,
    dataUpload,
    dataSolicitacao: documento.dataSolicitacao,
    dataEnvio: documento.dataEnvio,
    usuarioId: documento.analistaId || 0,
    analistaId: documento.analistaId,
    nomeAnalista: documento.nomeAnalista,
    empresaId: documento.empresaId,
    nomeEmpresa: documento.nomeEmpresa,
    emailDestinatario: documento.emailDestinatario,
    tokenExpiraEm: documento.tokenExpiraEm,
  };
}

function getApiErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro na API";
}

export function useDocumentos() {
  return useQuery<Documento[]>({
    queryKey: ["documentos"],
    queryFn: async () => {
      const response = await api.get<DocumentoApi[]>("/documentos");
      return response.data.map(normalizeDocumento);
    },
  });
}

export function useDocumentoById(id: number) {
  return useQuery<Documento>({
    queryKey: ["documentos", id],
    queryFn: async () => {
      const response = await api.get<DocumentoApi>(`/documentos/${id}`);
      return normalizeDocumento(response.data);
    },
    enabled: !!id,
  });
}

export function useCreateDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentoDTO) => {
      const response = await api.post<DocumentoApi>("/documentos", data);
      return normalizeDocumento(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
    },
  });
}

export function useSolicitarDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SolicitarDocumentoDTO) => {
      try {
        const response = await api.post<DocumentoApi>("/documentos/solicitar", data);
        return normalizeDocumento(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
    },
  });
}

export function useReenviarSolicitacaoDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        const response = await api.patch<DocumentoApi>(`/documentos/${id}/reenviar`);
        return normalizeDocumento(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
    },
  });
}

export function useValidarDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: ValidarDocumentoDTO) => {
      try {
        const response = await api.patch<DocumentoApi>(`/documentos/${id}/validar`, {
          validado: status,
        });
        return normalizeDocumento(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
    },
  });
}

export function useUpdateDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateDocumentoDTO> }) => {
      const response = await api.put<DocumentoApi>(`/documentos/${id}`, data);
      return normalizeDocumento(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
    },
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/documentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
    },
  });
}

export async function getDocumentoDownloadUrl(id: number) {
  try {
    const response = await api.get<string>(`/documentos/${id}/download-url`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getDocumentoUploadInfo(token: string) {
  try {
    const response = await api.get<DocumentoUploadInfo>(`/documentos/public/${token}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function enviarDocumentoPorToken(token: string, file: File) {
  try {
    const formData = new FormData();
    formData.append("arquivo", file);

    const response = await api.patch<DocumentoApi>(`/documentos/public/${token}/enviar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return normalizeDocumento(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
