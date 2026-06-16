import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";

export interface ParticipanteReuniao {
  id: number;
  reuniao?: {
    id?: number;
    idReuniao?: number;
  };
  usuario?: {
    id?: number;
  };
}

export interface CreateParticipanteReuniaoDTO {
  reuniaoId: number;
  usuarioId: number;
}

export function useParticipantesReuniao() {
  return useQuery<ParticipanteReuniao[]>({
    queryKey: ["participantes-reuniao"],
    queryFn: async () => {
      const response = await api.get<ParticipanteReuniao[]>("/participantes-reuniao");
      return response.data;
    },
  });
}

export function useCreateParticipanteReuniao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reuniaoId, usuarioId }: CreateParticipanteReuniaoDTO) => {
      const response = await api.post("/participantes-reuniao", {
        reuniao: { idReuniao: reuniaoId },
        usuario: { id: usuarioId },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participantes-reuniao"] });
    },
  });
}

export function useDeleteParticipanteReuniao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/participantes-reuniao/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participantes-reuniao"] });
    },
  });
}
