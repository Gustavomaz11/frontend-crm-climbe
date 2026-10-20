import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";
import { useAuthStore } from "@/store/useAuthStore";

export interface DriveArquivo {
  id: string;
  nome: string;
  contentType: string;
  tamanho: number;
  webViewLink?: string | null;
}
export interface DriveServico { servico: string; nome: string; pastaId: string | null }
export interface DrivePastas { servicos: DriveServico[]; mensagem?: string | null }
interface Envelope<T> { success: boolean; data: T; message?: string }
const path = (taskId: number, servico?: string) => `/tarefas/CONTRATO/${taskId}/drive${servico ? `/${servico}` : ""}`;
const unwrap = <T,>(response: Envelope<T>) => {
  if (!response.success) throw new Error(response.message || "Não foi possível acessar o Drive.");
  return response.data;
};
const request = async <T,>(action: () => Promise<T>) => {
  try { return await action(); }
  catch (error) {
    throw new Error(isAxiosError<{ message?: string; detail?: string }>(error)
      ? error.response?.data?.message || error.response?.data?.detail || error.message
      : error instanceof Error ? error.message : "Não foi possível acessar o Drive.");
  }
};
const useUsuarioId = () => useAuthStore((state) => state.basicUserData?.id ?? state.userData?.id);

export const useTarefaDrive = (taskId: number) => {
  const usuarioId = useUsuarioId();
  return useQuery({
    queryKey: ["tarefa-drive", usuarioId, taskId, "servicos"],
    queryFn: () => request(async () => unwrap((await api.get<Envelope<DrivePastas>>(path(taskId))).data)),
    enabled: taskId > 0, refetchInterval: 15000,
  });
};
export const useArquivosDrive = (taskId: number, servico: DriveServico | undefined, pastaId: string | null) => {
  const usuarioId = useUsuarioId();
  return useQuery({
    queryKey: ["tarefa-drive", usuarioId, taskId, servico?.servico, pastaId],
    queryFn: () => request(async () => unwrap((await api.get<Envelope<DriveArquivo[]>>(`${path(taskId, servico?.servico)}/arquivos`,
      { params: { pastaId } })).data)),
    enabled: taskId > 0 && !!servico?.pastaId, refetchInterval: 15000,
  });
};
export const useAlterarDrive = (taskId: number, servico?: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { pastaId: string | null; nome: string } | { pastaId: string | null; files: File[] }) => request(async () => {
      if ("nome" in input) return unwrap((await api.post<Envelope<DriveArquivo>>(`${path(taskId, servico)}/pastas`,
        { nome: input.nome, pastaPaiId: input.pastaId })).data);
      const form = new FormData();
      input.files.forEach((file) => form.append("arquivos", file));
      if (input.pastaId) form.append("pastaId", input.pastaId);
      return unwrap((await api.post<Envelope<DriveArquivo[]>>(`${path(taskId, servico)}/arquivos`, form,
        { headers: { "Content-Type": "multipart/form-data" } })).data);
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["tarefa-drive"] }),
  });
};
export const baixarArquivoDrive = (taskId: number, servico: string, arquivo: DriveArquivo) => request(async () =>
  api.get<Blob>(`${path(taskId, servico)}/arquivos/${encodeURIComponent(arquivo.id)}/conteudo`, { responseType: "blob", params: { download: true } }));
