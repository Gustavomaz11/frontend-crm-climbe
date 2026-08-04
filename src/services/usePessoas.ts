import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

export interface PessoaEmpresa {
  id: number;
  nome: string;
  cnpj: string;
}

export interface PessoaCliente {
  id: number;
  nome: string;
  cpf?: string | null;
  email: string;
  telefone: string;
  cargo?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  empresas: PessoaEmpresa[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface PessoaClienteInput {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo: string;
  observacoes: string;
  ativo: boolean;
  empresaIds: number[];
}

const errorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string; detail?: string }>(error)) {
    return error.response?.data?.message || error.response?.data?.detail || error.message;
  }
  return error instanceof Error ? error.message : "Erro ao processar cadastro da pessoa";
};

const sanitize = (input: PessoaClienteInput): PessoaClienteInput => ({
  ...input,
  nome: input.nome.trim(),
  cpf: input.cpf.trim(),
  email: input.email.trim().toLowerCase(),
  telefone: input.telefone.trim(),
  cargo: input.cargo.trim(),
  observacoes: input.observacoes.trim(),
  empresaIds: [...new Set(input.empresaIds)],
});

export const usePessoas = () => useQuery<PessoaCliente[]>({
  queryKey: ["pessoas"],
  queryFn: async () => (await api.get<PessoaCliente[]>("/pessoas")).data,
});

export const useCreatePessoa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PessoaClienteInput) => {
      try {
        return (await api.post<PessoaCliente>("/pessoas", sanitize(input))).data;
      } catch (error) {
        throw new Error(errorMessage(error));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pessoas"] }),
  });
};

export const useUpdatePessoa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: PessoaClienteInput }) => {
      try {
        return (await api.put<PessoaCliente>(`/pessoas/${id}`, sanitize(input))).data;
      } catch (error) {
        throw new Error(errorMessage(error));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pessoas"] }),
  });
};

export const useDeletePessoa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        await api.delete(`/pessoas/${id}`);
      } catch (error) {
        throw new Error(errorMessage(error));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pessoas"] }),
  });
};
