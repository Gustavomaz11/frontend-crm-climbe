import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

export interface Empresa {
  id: number;
  idEmpresa?: number;
  nome: string;
  nomeFantasia?: string;
  razaoSocial?: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

type EmpresaApi = Empresa & {
  idEmpresa?: number;
  nomeFantasia?: string;
  razaoSocial?: string;
  logradouro?: string;
  uf?: string;
};

function normalizeEmpresa(empresa: EmpresaApi): Empresa {
  return {
    ...empresa,
    id: empresa.id ?? empresa.idEmpresa ?? 0,
    idEmpresa: empresa.idEmpresa ?? empresa.id,
    nome:
      empresa.nome ??
      empresa.nomeFantasia ??
      empresa.razaoSocial ??
      `Empresa #${empresa.idEmpresa ?? empresa.id}`,
    endereco: empresa.endereco ?? empresa.logradouro ?? "",
    estado: empresa.estado ?? empresa.uf ?? "",
  };
}

export interface CreateEmpresaDTO {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  representanteNome: string;
  representanteCpf: string;
  representanteContato: string;
  nome?: string;
  endereco?: string;
  estado?: string;
}

interface ApiErrorResponse {
  message?: string;
  detail?: string;
  error?: string;
}

interface ApiValidationError {
  message?: string;
  field?: string;
  code?: string;
}

function getApiErrorMessage(error: unknown) {
  if (isAxiosError<ApiErrorResponse | ApiValidationError[]>(error)) {
    const data = error.response?.data;
    if (Array.isArray(data)) {
      return data
        .map((item) => item.field ? `${item.field}: ${item.message}` : item.message)
        .filter(Boolean)
        .join("; ") || error.message;
    }

    return data?.message || data?.detail || data?.error || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro na API";
}

export function useEmpresas() {
  return useQuery<Empresa[]>({
    queryKey: ["empresas"],
    queryFn: async () => {
      const response = await api.get<Empresa[]>("/empresas");
      return response.data.map(normalizeEmpresa);
    },
  });
}

export function useEmpresaById(id: number) {
  return useQuery<Empresa>({
    queryKey: ["empresas", id],
    queryFn: async () => {
      const response = await api.get<Empresa>(`/empresas/${id}`);
      return normalizeEmpresa(response.data);
    },
    enabled: !!id,
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmpresaDTO) => {
      try {
        const payload: CreateEmpresaDTO = {
          razaoSocial: data.razaoSocial.trim(),
          nomeFantasia: data.nomeFantasia.trim() || data.razaoSocial.trim(),
          cnpj: data.cnpj.trim(),
          logradouro: data.logradouro.trim(),
          numero: data.numero.trim(),
          bairro: data.bairro.trim(),
          cidade: data.cidade.trim(),
          uf: data.uf.trim(),
          cep: data.cep.trim(),
          telefone: data.telefone.trim(),
          email: data.email.trim(),
          representanteNome: data.representanteNome.trim(),
          representanteCpf: data.representanteCpf.trim(),
          representanteContato: data.representanteContato.trim(),
        };
        const response = await api.post<EmpresaApi>("/empresas", payload);
        return normalizeEmpresa(response.data);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateEmpresaDTO> }) => {
      const response = await api.put<EmpresaApi>(`/empresas/${id}`, data);
      return normalizeEmpresa(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}

export function useDeleteEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/empresas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}
