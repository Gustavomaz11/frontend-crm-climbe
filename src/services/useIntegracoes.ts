import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/api";

export type ModuloIntegracao = "TECNICO" | "COMERCIAL" | "JURIDICO";
export const modulosIntegracao: Record<ModuloIntegracao, string> = { TECNICO: "Técnico", COMERCIAL: "Comercial", JURIDICO: "Jurídico" };
export const metodosIntegracao = ["GET", "POST", "PUT", "DELETE", "PATCH"];
export interface OperacaoIntegracao { codigo: string; modulo: ModuloIntegracao; metodo: string; caminho: string; descricao: string; payloadExemplo: string; respostaExemplo: string }
export interface CadastroIntegracao {
  nome: string; cnpj: string; responsavel: string; email: string; modulo: ModuloIntegracao;
  metodos: string[]; operacoes: string[]; empresaIds: number[]; expiraEm: string; limitePorMinuto: number;
}
export interface Integracao extends CadastroIntegracao {
  id: string; clientId: string; status: "PENDENTE" | "ATIVO" | "SUSPENSO" | "REVOGADO";
  criadoEm: string; ultimoUso: string | null; emailStatus: string; emailTentativas: number;
}
export interface AuditoriaIntegracao {
  id: number; evento: string; metodo?: string; rota?: string; status?: number; criadoEm: string;
  payloadDisponivel?: boolean; payloadLimiteExcedido?: boolean;
}
export interface EmpresaIntegracao { id: number; nome: string; cnpj: string }
export const erroIntegracao = (erro: unknown) => {
  if (axios.isAxiosError(erro)) {
    const dados = erro.response?.data;
    if (Array.isArray(dados)) return dados.map(e => e.message || e.mensagem).filter(Boolean).join("; ") || "Confira os campos do cadastro.";
    return dados?.message || "Não foi possível concluir a operação.";
  }
  return erro instanceof Error ? erro.message : "Não foi possível concluir a operação.";
};
export const useIntegracoes = (enabled: boolean) => useQuery({ queryKey: ["integracoes"], enabled,
  queryFn: async () => (await api.get<Integracao[]>("/integracoes")).data, refetchInterval: 15000 });
export const useCatalogoIntegracoes = (enabled: boolean) => useQuery({ queryKey: ["integracoes-catalogo"], enabled,
  queryFn: async () => (await api.get<OperacaoIntegracao[]>("/integracoes/catalogo")).data });
export const useEmpresasIntegracoes = (enabled: boolean) => useQuery({ queryKey: ["integracoes-empresas"], enabled,
  queryFn: async () => (await api.get<EmpresaIntegracao[]>("/integracoes/empresas")).data });
export const useAuditoriaIntegracao = (id?: string) => useQuery({ queryKey: ["integracoes-auditoria", id], enabled: !!id,
  queryFn: async () => (await api.get<AuditoriaIntegracao[]>(`/integracoes/${id}/auditoria`)).data });
export const usePayloadAuditoriaIntegracao = (id: string, eventoId?: number) => useQuery({
  queryKey: ["integracoes-auditoria-payload", id, eventoId], enabled: eventoId !== undefined,
  queryFn: async () => (await api.get<{ payload: string }>(`/integracoes/${id}/auditoria/${eventoId}/payload`)).data,
});
export const useSalvarIntegracao = () => {
  const cache = useQueryClient();
  return useMutation({ mutationFn: async ({ id, dados }: { id?: string; dados: CadastroIntegracao }) =>
    (id ? await api.put<Integracao>(`/integracoes/${id}`, dados) : await api.post<Integracao>("/integracoes", dados)).data,
  onSuccess: () => cache.invalidateQueries({ queryKey: ["integracoes"] }) });
};
export const useAcaoIntegracao = () => {
  const cache = useQueryClient();
  return useMutation({ mutationFn: async ({ id, acao, status }: { id: string; acao: "status" | "rotacionar" | "reenviar"; status?: string }) =>
    acao === "status" ? api.patch(`/integracoes/${id}/status`, { status }) : api.post(`/integracoes/${id}/${acao}`),
  onSuccess: async () => { await cache.invalidateQueries({ queryKey: ["integracoes"] }); await cache.invalidateQueries({ queryKey: ["integracoes-auditoria"] }); } });
};
export const baixarDocumentacaoIntegracao = async (id: string) => {
  const { data } = await api.get<Blob>(`/integracoes/${id}/documentacao`, { responseType: "blob" });
  const url = URL.createObjectURL(data); const link = document.createElement("a");
  link.href = url; link.download = "documentacao-integracao-climbe.pdf"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
// Instância pública: não envia cookies de autenticação nem tenta renovar a sessão do usuário.
const publica = axios.create({ baseURL: import.meta.env.VITE_API_URL });
export const ativarIntegracao = async (token: string) =>
  (await publica.post<{ client_id: string; client_secret: string }>("/api/integracoes/ativar", { token })).data;
