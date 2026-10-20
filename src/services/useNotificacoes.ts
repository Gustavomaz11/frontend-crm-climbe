import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";

export interface Notificacao {
  id: number;
  mensagem: string;
  destino?: string | null;
  tipo: string;
  lida: boolean;
  dataCriacao: string;
  dataEnvio: string;
}
export const getNotificacaoDestino = (mensagem: string, destino?: string | null) => {
  const rota = destino || mensagem.match(/\/(?:contratos\/kanban|pipeline-vendas|pipeline-pre-vendas|agenda)\?[A-Za-z0-9=&_-]+/)?.[0];
  if (!rota || (!/^\/(?:contratos\/kanban|pipeline-vendas|pipeline-pre-vendas|agenda)\?[A-Za-z0-9=&_-]+$/.test(rota)
    && !/^\/contratos\?contrato=[1-9]\d*$/.test(rota) && !/^\/propostas\?proposta=[1-9]\d*$/.test(rota))) return undefined;
  return rota;
};
export const useLerTodasNotificacoes = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => { await api.patch("/notificacoes/minhas/lidas"); },
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["notificacoes"] }); },
  });
};
export const useMinhasNotificacoes = (usuarioId?: number) => useQuery({
  queryKey: ["notificacoes", usuarioId], enabled: !!usuarioId,
  refetchOnMount: "always",
  queryFn: async () => (await api.get<Notificacao[]>("/notificacoes/minhas")).data,
});
export const useLerNotificacao = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => { await api.patch(`/notificacoes/minhas/${id}/lida`); },
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["notificacoes"] }); },
  });
};
