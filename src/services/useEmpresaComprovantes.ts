import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";

export interface EmpresaComprovante { id: number; tipo: string; status: string; mensagem?: string; geradoEm?: string }
export const COMPROVANTES: Record<string, string> = { RFB: "Receita Federal", SIMPLES: "Simples Nacional e MEI", CCC: "Cadastro de Contribuintes", SUFRAMA: "SUFRAMA" };

export const useEmpresaComprovantes = (empresaId: number, enabled: boolean) => useQuery({
  queryKey: ["empresa-comprovantes", empresaId], enabled,
  queryFn: async () => (await api.get<EmpresaComprovante[]>(`/empresas/${empresaId}/comprovantes`)).data,
  refetchInterval: query => query.state.data?.some(item => ["PENDENTE", "PROCESSANDO"].includes(item.status)) ? 3000 : false,
});

export const useSolicitarEmpresaComprovantes = (empresaId: number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id?: number) => api.post(`/empresas/${empresaId}/comprovantes${id ? `/${id}/tentar-novamente` : ""}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ["empresa-comprovantes", empresaId] }),
  });
};

export const baixarEmpresaComprovante = async (empresaId: number, id: number, signal: AbortSignal) => {
  const { data } = await api.get<Blob>(`/empresas/${empresaId}/comprovantes/${id}/pdf`, { responseType: "blob", signal });
  return new Blob([data], { type: "application/pdf" });
};
