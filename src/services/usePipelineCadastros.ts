import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

export interface PipelineTag { id: number; nome: string; cor: string; ativo: boolean }
export interface PipelineCampo { id: number; nome: string; tipo: "TEXTO" | "NUMERO" | "DATA" | "SELECAO" | "BOOLEANO"; escopo: "TODOS" | "PRE_VENDAS" | "VENDAS"; opcoes?: string; ativo: boolean }
export interface CampanhaOpcao { id: number; nome: string; estrategia: string; ativo: boolean }
const root = "/pipeline-vendas/cadastros";
export const commercialError = (error: unknown) => isAxiosError(error) ? error.response?.data?.message || error.message : "Não foi possível concluir a operação";
export const usePipelineTags = () => useQuery({ queryKey: ["pipeline-cadastros", "tags"], queryFn: async () => (await api.get<{ data: PipelineTag[] }>(`${root}/tags`)).data.data });
export const usePipelineCampos = () => useQuery({ queryKey: ["pipeline-cadastros", "campos"], queryFn: async () => (await api.get<{ data: PipelineCampo[] }>(`${root}/campos`)).data.data });
export const useCampanhasOpcoes = () => useQuery({ queryKey: ["pipeline-cadastros", "campanhas"], queryFn: async () => (await api.get<{ data: CampanhaOpcao[] }>(`${root}/campanhas`)).data.data });
export const useSalvarCadastro = () => {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ tipo, id, data }: { tipo: "tags" | "campos"; id?: number; data: Partial<PipelineTag> | Partial<PipelineCampo> }) => {
    if (id) return api.put(`${root}/${tipo}/${id}`, data);
    return api.post(`${root}/${tipo}`, data);
  }, onSuccess: () => client.invalidateQueries({ queryKey: ["pipeline-cadastros"] }) });
};

export const preVendaEtapas = [
  ["LISTA_LEADS", "Lista de leads"], ["TENTATIVA_CONTATO", "Tentativa de contato"],
  ["LEAD_CONECTADO", "Lead conectado"], ["REUNIAO_MARCADA", "Reunião marcada"], ["REUNIAO_REALIZADA", "Reunião realizada"],
] as const;
