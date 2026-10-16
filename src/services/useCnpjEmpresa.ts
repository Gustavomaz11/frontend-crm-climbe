import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";
import { isValidCnpj } from "@/lib/cnpj";
import type { CreateEmpresaDTO } from "./useEmpresas";

export type CnpjEmpresa = Pick<CreateEmpresaDTO, "cnpj" | "razaoSocial" | "nomeFantasia" | "logradouro" | "numero" | "bairro" | "cidade" | "uf" | "cep" | "telefone" | "email" | "tipoEmpresa" | "dadosCadastrais"> & { avisos?: string[] };

export const useCnpjEmpresa = (value: string, enabled: boolean) => {
  const cnpj = value.replace(/\D/g, "");
  const valido = enabled && isValidCnpj(cnpj);
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    if (!valido) { setDebounced(""); return; }
    const timer = window.setTimeout(() => setDebounced(cnpj), 500);
    return () => window.clearTimeout(timer);
  }, [cnpj, valido]);

  const atual = valido && debounced === cnpj;
  const query = useQuery({
    queryKey: ["cnpja-empresa", debounced],
    enabled: atual,
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get<CnpjEmpresa>(`/empresas/consulta-cnpj/${debounced}`, { signal, timeout: 75000 });
        return data;
      } catch (error) {
        const message = isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
        throw new Error(message || "Não foi possível consultar o CNPJ. Preencha os dados manualmente ou tente novamente.");
      }
    },
    retry: false,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    dados: atual ? query.data : undefined,
    consultando: valido && (!atual || query.isFetching),
    erro: atual ? query.error?.message : undefined,
    consultarNovamente: () => { if (atual) void query.refetch(); },
  };
};
