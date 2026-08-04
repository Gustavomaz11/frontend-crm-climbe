import { isAxiosError } from "axios";
import { api } from "@/api";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  detail?: string;
}

export type RevisaoTipo = "PROPOSTA" | "CONTRATO";
export type RevisaoStatus = "AGUARDANDO_CLIENTE" | "AJUSTES_SOLICITADOS" | "APROVADO" | "REPROVADO";

export interface RevisaoAnotacao {
  id?: number;
  localId?: string;
  pagina: number;
  x: number;
  y: number;
  largura: number;
  altura: number;
  cor: string;
  comentario: string;
}

export interface RevisaoVersao {
  id: number;
  numero: number;
  nomeArquivo: string;
  contentType: string;
  totalPaginas: number;
  resultado: RevisaoStatus;
  comentarioGeral?: string | null;
  justificativa?: string | null;
  criadoEm: string;
  respondidoEm?: string | null;
  anotacoes: RevisaoAnotacao[];
}

export interface RevisaoDocumento {
  id: number;
  tipo: RevisaoTipo;
  referenciaId: number;
  empresaNome: string;
  destinatarioEmail: string;
  destinatarioNome?: string | null;
  status: RevisaoStatus;
  versaoAtual: number;
  nomeArquivo: string;
  contentType: string;
  totalPaginas: number;
  justificativa?: string | null;
  tokenExpiraEm: string;
  criadoEm: string;
  atualizadoEm: string;
  respondidoEm?: string | null;
  emailStatus: "PENDENTE" | "ENVIADO" | "FALHOU";
  emailEnviadoEm?: string | null;
  assinaturaUrl?: string | null;
  versoes: RevisaoVersao[];
}

function unwrap<T>(value: ApiEnvelope<T> | T): T {
  if (value && typeof value === "object" && "success" in value && "data" in value) {
    const envelope = value as ApiEnvelope<T>;
    if (!envelope.success) throw new Error(envelope.message || "Erro na API");
    return envelope.data;
  }
  return value as T;
}

function message(error: unknown) {
  if (isAxiosError<ApiEnvelope<unknown> | Array<{ message?: string }>>(error)) {
    const data = error.response?.data;
    if (Array.isArray(data)) {
      return data.map((item) => item.message).filter(Boolean).join(". ") || error.message;
    }
    return data?.message || data?.detail || error.message;
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação";
}

async function request<T>(promise: Promise<{ data: ApiEnvelope<T> | T }>) {
  try {
    return unwrap((await promise).data);
  } catch (error) {
    throw new Error(message(error));
  }
}

export function getRevisaoPublica(token: string) {
  return request<RevisaoDocumento>(api.get(`/revisoes/public/${token}`));
}

export function enviarRevisaoPublica(token: string, anotacoes: RevisaoAnotacao[], comentarioGeral?: string) {
  return request<RevisaoDocumento>(api.post(`/revisoes/public/${token}/enviar-revisao`, {
    anotacoes: anotacoes.map(({ pagina, x, y, largura, altura, cor, comentario }) => ({
      pagina, x, y, largura, altura, cor, comentario,
    })),
    comentarioGeral,
  }));
}

export function aprovarRevisaoPublica(token: string) {
  return request<RevisaoDocumento>(api.post(`/revisoes/public/${token}/aprovar`));
}

export function reprovarRevisaoPublica(token: string, justificativa: string) {
  return request<RevisaoDocumento>(api.post(`/revisoes/public/${token}/reprovar`, { justificativa }));
}

export function getRevisaoInterna(tipo: RevisaoTipo, referenciaId: number) {
  return request<RevisaoDocumento>(api.get(`/revisoes/${tipo}/${referenciaId}`));
}

export function enviarNovaVersao(revisaoId: number, arquivo: File) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);
  return request<RevisaoDocumento>(api.post(`/revisoes/${revisaoId}/nova-versao`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }));
}

export function reenviarRevisao(revisaoId: number) {
  return request<RevisaoDocumento>(api.post(`/revisoes/${revisaoId}/reenviar`));
}

export function getRevisaoPublicPageUrl(token: string, pagina: number) {
  return `${String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/revisoes/public/${token}/paginas/${pagina}`;
}

export async function getRevisaoInternalPageBlob(revisaoId: number, versao: number, pagina: number) {
  try {
    const response = await api.get(`/revisoes/${revisaoId}/paginas/${versao}/${pagina}`, { responseType: "blob" });
    return URL.createObjectURL(response.data);
  } catch (error) {
    throw new Error(message(error));
  }
}
