import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { useSalasReuniao } from "./useReunioes";
import { useUsuarios } from "./useUsuarios";

export interface PeriodoReuniao {
  data: string;
  hora: string;
  horaFim: string;
  reuniaoId?: number | null;
}

export interface ReuniaoDisponibilidade {
  salas: { email: string; disponivel: boolean | null }[];
  participantes: { id: number; disponivel: boolean | null }[];
  localDisponivel: boolean | null;
}

export const periodoReuniaoValido = (periodo: PeriodoReuniao) => Boolean(
  periodo.data && periodo.hora && periodo.horaFim && periodo.horaFim > periodo.hora,
);

export const useReuniaoDisponibilidade = (periodo: PeriodoReuniao, presencial: boolean, local: string, enabled: boolean) => {
  const salas = useSalasReuniao(enabled && presencial);
  const usuarios = useUsuarios(enabled);
  const valido = periodoReuniaoValido(periodo);
  const request = {
    ...periodo,
    salaEmails: presencial ? (salas.data ?? []).map(sala => sala.email) : [],
    participanteIds: (usuarios.data ?? []).map(usuario => usuario.id),
    local: presencial ? local.trim() : "",
  };
  const query = useQuery({
    queryKey: ["reuniao-disponibilidade", request],
    queryFn: async ({ signal }) => (await api.post<ReuniaoDisponibilidade>("/reunioes/disponibilidade", request, { signal })).data,
    enabled: enabled && valido && !usuarios.isLoading && (!presencial || !salas.isLoading),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: enabled ? 30_000 : false,
    retry: false,
  });
  return { ...query, valido, consultando: enabled && valido && (query.isFetching || usuarios.isLoading || presencial && salas.isLoading) };
};
