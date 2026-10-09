import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";
import type { UsuarioResumo } from "./useContratoKanban";

export type TarefaTipo = "CONTRATO" | "COMERCIAL";
export interface TarefaAnexo {
  id: number;
  nome: string;
  contentType: string;
  tamanho: number;
  autor: UsuarioResumo;
  criadoEm: string;
}
export interface TarefaComentario {
  id: number;
  comentarioPaiId?: number | null;
  autor: UsuarioResumo;
  conteudo: string;
  criadoEm: string;
  anexos: TarefaAnexo[];
}
interface Colaboracao { anexos: TarefaAnexo[]; comentarios: TarefaComentario[] }
interface Envelope<T> { success: boolean; data: T; message?: string }
const unwrap = <T,>(response: Envelope<T>) => {
  if (!response.success) throw new Error(response.message || "Não foi possível carregar a tarefa.");
  return response.data;
};
const request = async <T,>(action: () => Promise<T>) => {
  try { return await action(); }
  catch (error) {
    throw new Error(isAxiosError<{ message?: string; detail?: string }>(error)
      ? error.response?.data?.message || error.response?.data?.detail || error.message
      : error instanceof Error ? error.message : "Não foi possível concluir esta ação.");
  }
};
const path = (tipo: TarefaTipo, id: number) => `/tarefas/${tipo}/${id}/colaboracao`;
const addFiles = (form: FormData, files: File[]) => files.forEach((file) => form.append("arquivos", file));

export const useTarefaColaboracao = (tipo: TarefaTipo, id: number) => useQuery({
  queryKey: ["tarefa-colaboracao", tipo, id],
  queryFn: () => request(async () => unwrap((await api.get<Envelope<Colaboracao>>(path(tipo, id))).data)),
  enabled: id > 0,
});
export const useAnexarTarefa = (tipo: TarefaTipo, id: number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => request(async () => {
      const form = new FormData(); addFiles(form, files);
      return unwrap((await api.post<Envelope<TarefaAnexo[]>>(`${path(tipo, id)}/anexos`, form,
        { headers: { "Content-Type": "multipart/form-data" } })).data);
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["tarefa-colaboracao", tipo, id] }),
  });
};
export const useComentarTarefa = (tipo: TarefaTipo, id: number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ conteudo, comentarioPaiId, files }: { conteudo: string; comentarioPaiId?: number; files: File[] }) => request(async () => {
      const form = new FormData(); form.append("conteudo", conteudo.trim()); addFiles(form, files);
      if (comentarioPaiId) form.append("comentarioPaiId", String(comentarioPaiId));
      return unwrap((await api.post<Envelope<TarefaComentario>>(`${path(tipo, id)}/comentarios`, form,
        { headers: { "Content-Type": "multipart/form-data" } })).data);
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["tarefa-colaboracao", tipo, id] }),
  });
};
export const baixarAnexoTarefa = (tipo: TarefaTipo, id: number, anexo: TarefaAnexo) => request(async () =>
  (await api.get<Blob>(`${path(tipo, id)}/anexos/${anexo.id}/conteudo`, { responseType: "blob" })).data);
