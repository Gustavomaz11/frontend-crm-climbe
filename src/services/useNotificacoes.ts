import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";

export interface Notificacao {
  id: number;
  mensagem: string;
  tipo: string;
  lida: boolean;
  dataCriacao: string;
  dataEnvio: string;
}
export const getNotificacaoDestino = (mensagem: string) => {
  const contratoId = mensagem.match(/\/contratos\/kanban\?contrato=(\d+)/)?.[1];
  return contratoId ? `/contratos/kanban?contrato=${contratoId}` : undefined;
};
export const useMinhasNotificacoes = (usuarioId?: number) => useQuery({
  queryKey: ["notificacoes", usuarioId], enabled: !!usuarioId, refetchInterval: 60_000,
  queryFn: async () => (await api.get<Notificacao[]>("/notificacoes/minhas")).data,
});
export const useLerNotificacao = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => { await api.patch(`/notificacoes/minhas/${id}/lida`); },
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["notificacoes"] }); },
  });
};
