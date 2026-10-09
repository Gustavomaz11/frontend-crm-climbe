import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";
import type { UsuarioResumo } from "./useContratoKanban";
import type { CommercialService } from "./commercialProposal";
import { useAuthStore } from "@/store/useAuthStore";

const useUsuarioAtualId = () => useAuthStore(s => s.basicUserData?.id ?? s.userData?.id);

export interface ContratoEquipe {
  contratoId: number;
  configurada: boolean;
  lider: boolean;
  responsavel?: UsuarioResumo | null;
  membros: UsuarioResumo[];
  usuariosDisponiveis: UsuarioResumo[];
  temporarios: Array<{ usuario: UsuarioResumo; tarefas: Array<{ id: number; titulo: string }> }>;
}
export interface ContratoRateioTecnico {
  contratoId: number;
  competencia: string;
  competenciaPagamento: string;
  recebimentoTotal: number;
  comissaoTecnicaTotal: number;
  registrado: boolean;
  servicos: Array<{ servico: CommercialService; recebimento: number; percentual: number; comissao: number }>;
  participantes: Array<{ usuario: UsuarioResumo; valor: number }>;
}
export const useContratoEquipe = (id?: number) => {
  const usuarioId = useUsuarioAtualId();
  return useQuery({
    queryKey: ["contratos", id, "equipe", usuarioId],
    enabled: !!id,
    retry: false,
    queryFn: async () => (await api.get<ContratoEquipe>(`/contratos/${id}/equipe`)).data,
  });
};
export const useSalvarContratoEquipe = () => {
  const client = useQueryClient();
  const usuarioId = useUsuarioAtualId();
  return useMutation({
    mutationFn: async ({ id, usuarioIds }: { id: number; usuarioIds: number[] }) => {
      try { return (await api.put<ContratoEquipe>(`/contratos/${id}/equipe`, { usuarioIds })).data; }
      catch (error) {
        throw new Error(isAxiosError(error) ? error.response?.data?.message || error.response?.data?.detail || error.message
          : error instanceof Error ? error.message : "Não foi possível salvar a equipe.");
      }
    },
    onSuccess: (data, { id }) => {
      client.setQueryData(["contratos", id, "equipe", usuarioId], data);
      client.invalidateQueries({ queryKey: ["contratos"] });
      client.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
};
export const useContratoRateioTecnico = (id: number, competencia: string) => {
  const usuarioId = useUsuarioAtualId();
  return useQuery({
    queryKey: ["contratos", id, "rateio-tecnico", competencia, usuarioId],
    enabled: !!id && !!competencia,
    queryFn: async () => (await api.get<ContratoRateioTecnico>(`/contratos/${id}/rateio-tecnico`, { params: { competencia } })).data,
  });
};
