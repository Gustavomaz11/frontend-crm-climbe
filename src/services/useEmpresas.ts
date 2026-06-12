import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
      const payload = {
        ...data,
        nome: data.nomeFantasia || data.razaoSocial,
        endereco: `${data.logradouro}, ${data.numero}`,
        estado: data.uf,
      };
      const response = await api.post<EmpresaApi>("/empresas", payload);
      return normalizeEmpresa(response.data);
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
