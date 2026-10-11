import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";
import { useAuthStore } from "@/store/useAuthStore";

export interface KanbanArquivoContexto {
  tipo: "CONTRATO_TAREFA" | "PIPELINE_TAREFA" | "NEGOCIO" | "CONTRATO" | "REUNIAO";
  contratoId?: number;
  negocioId?: number;
  funilId?: number;
}

export interface KanbanItemArquivado<T = unknown> {
  id: number;
  titulo: string;
  coluna: string;
  responsaveis?: string | null;
  arquivadoEm: string;
  item: T;
}

const arquivoPath = (contexto: KanbanArquivoContexto, id?: number) => {
  switch (contexto.tipo) {
    case "CONTRATO_TAREFA": return id === undefined
      ? `/contratos/${contexto.contratoId}/kanban/arquivados`
      : `/contratos/${contexto.contratoId}/kanban/tasks/${id}/arquivamento`;
    case "PIPELINE_TAREFA": return id === undefined ? "/pipeline-vendas/tarefas/arquivados" : `/pipeline-vendas/tarefas/${id}/arquivamento`;
    case "NEGOCIO": return id === undefined ? "/pipeline-vendas/arquivados" : `/pipeline-vendas/negocios/${id}/arquivamento`;
    case "CONTRATO": return id === undefined ? "/contratos/arquivados" : `/contratos/${id}/arquivamento`;
    case "REUNIAO": return id === undefined ? "/reunioes/arquivados" : `/reunioes/${id}/arquivamento`;
  }
};

export const getKanbanArquivoError = (error: unknown) => isAxiosError(error)
  ? error.response?.data?.message || "Não foi possível atualizar o arquivamento. Tente novamente."
  : error instanceof Error ? error.message : "Não foi possível atualizar o arquivamento. Tente novamente.";

export const useKanbanArquivados = <T,>(contexto: KanbanArquivoContexto, enabled: boolean) => {
  const usuarioId = useAuthStore((state) => state.basicUserData?.id ?? state.userData?.id);
  return useQuery<KanbanItemArquivado<T>[]>({
    queryKey: ["kanban-arquivos", usuarioId, contexto],
    enabled,
    queryFn: async () => (await api.get<KanbanItemArquivado<T>[]>(arquivoPath(contexto), {
      params: { funilId: contexto.funilId, negocioId: contexto.negocioId },
    })).data,
  });
};

export const useAlterarArquivamentoKanban = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contexto, id, arquivado }: { contexto: KanbanArquivoContexto; id: number; arquivado: boolean }) => {
      await api.patch(arquivoPath(contexto, id), { arquivado });
    },
    onSuccess: (_data, { contexto }) => {
      const recurso = contexto.tipo === "CONTRATO" || contexto.tipo === "CONTRATO_TAREFA" ? "contratos"
        : contexto.tipo === "REUNIAO" ? "reunioes" : "pipeline-vendas";
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["kanban-arquivos"] }),
        queryClient.invalidateQueries({ queryKey: [recurso] }),
        ...(contexto.tipo === "PIPELINE_TAREFA" ? [queryClient.invalidateQueries({ queryKey: ["pipeline-atividades"] })] : []),
      ]);
    },
  });
};
