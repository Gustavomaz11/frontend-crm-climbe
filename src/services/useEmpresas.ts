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
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  uf: string;
  cep: string;
  representanteNome: string;
  representanteCpf: string;
  representanteContato: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface EmpresaParcela {
  id: number;
  numero: number;
  vencimento: string;
  valor: number;
  status: string;
}

export interface EmpresaServicoContratado {
  contratoId: number;
  servico: string;
  situacao: string;
  valorTotal: number;
  proximoRecebimentoValor?: number | null;
  proximoRecebimentoData?: string | null;
  parcelas: EmpresaParcela[];
  funcionarios: Array<{ id: number; nome: string; email: string }>;
}

export interface EmpresaFinanceiro {
  empresaId: number;
  proximoRecebimentoValor?: number | null;
  proximoRecebimentoData?: string | null;
  servicos: EmpresaServicoContratado[];
}

type EmpresaApi = Partial<Empresa> & {
  id?: number;
  idEmpresa?: number;
  nomeFantasia?: string;
  razaoSocial?: string;
  logradouro?: string;
  uf?: string;
};

export function normalizeEmpresa(empresa: EmpresaApi): Empresa {
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
    logradouro: empresa.logradouro ?? empresa.endereco ?? "",
    numero: empresa.numero ?? "",
    bairro: empresa.bairro ?? "",
    estado: empresa.estado ?? empresa.uf ?? "",
    uf: empresa.uf ?? empresa.estado ?? "",
    cep: empresa.cep ?? "",
    email: empresa.email ?? "",
    telefone: empresa.telefone ?? "",
    cnpj: empresa.cnpj ?? "",
    representanteNome: empresa.representanteNome ?? "",
    representanteCpf: empresa.representanteCpf ?? "",
    representanteContato: empresa.representanteContato ?? "",
    dataCriacao: empresa.dataCriacao ?? "",
    dataAtualizacao: empresa.dataAtualizacao ?? "",
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

export function sanitizeEmpresaPayload(data: CreateEmpresaDTO): CreateEmpresaDTO {
  return {
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
}

export function empresaToForm(empresa: Empresa): CreateEmpresaDTO {
  return {
    razaoSocial: empresa.razaoSocial ?? "",
    nomeFantasia: empresa.nomeFantasia ?? "",
    cnpj: empresa.cnpj ?? "",
    logradouro: empresa.logradouro ?? empresa.endereco ?? "",
    numero: empresa.numero ?? "",
    bairro: empresa.bairro ?? "",
    cidade: empresa.cidade ?? "",
    uf: empresa.uf ?? empresa.estado ?? "",
    cep: empresa.cep ?? "",
    telefone: empresa.telefone ?? "",
    email: empresa.email ?? "",
    representanteNome: empresa.representanteNome ?? "",
    representanteCpf: empresa.representanteCpf ?? "",
    representanteContato: empresa.representanteContato ?? "",
  };
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

export function useEmpresaFinanceiro(id: number) {
  return useQuery<EmpresaFinanceiro>({
    queryKey: ["empresas", id, "financeiro"],
    queryFn: async () => {
      const response = await api.get<EmpresaFinanceiro>(`/empresas/${id}/financeiro`);
      return response.data;
    },
    enabled: id > 0,
  });
}

export function useAlterarVencimentoParcela(empresaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contratoId, parcelaId, vencimento }: { contratoId: number; parcelaId: number; vencimento: string }) => {
      const response = await api.patch(`/contratos/${contratoId}/parcelas/${parcelaId}/vencimento`, { vencimento });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["empresas", empresaId, "financeiro"] }),
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmpresaDTO) => {
      try {
        const payload = sanitizeEmpresaPayload(data);
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
    mutationFn: async ({ id, data }: { id: number; data: CreateEmpresaDTO }) => {
      try {
        const response = await api.put<EmpresaApi>(
          `/empresas/${id}`,
          sanitizeEmpresaPayload(data),
        );
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

export function useDeleteEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        await api.delete(`/empresas/${id}`);
      } catch (error) {
        throw new Error(getApiErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}
