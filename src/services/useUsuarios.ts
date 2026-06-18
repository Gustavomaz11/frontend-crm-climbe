import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";

interface UsuarioApi {
  id: number;
  email: string;
  nomeCompleto: string;
  cpf?: string;
  contato?: string;
  situacao?: string;
  cargo?: string | { nome?: string } | null;
  cargoNome?: string | null;
  fotoPerfil?: string | null;
  aceitouTermos?: boolean;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

type OrigemSolicitacaoAcesso = "USUARIO" | "GOOGLE";

interface SolicitacaoAcessoApi {
  origem: OrigemSolicitacaoAcesso;
  id: number;
  nomeCompleto?: string | null;
  email: string;
  avatarUrl?: string | null;
  cpf?: string | null;
  contato?: string | null;
  cargoNome?: string | null;
  criadoEm?: string | null;
  expiraEm?: string | null;
}

export interface SolicitacaoAcesso {
  origem: OrigemSolicitacaoAcesso;
  id: number;
  nomeCompleto: string;
  email: string;
  avatarUrl?: string | null;
  cpf?: string | null;
  contato?: string | null;
  cargoNome?: string | null;
  criadoEm?: string | null;
  expiraEm?: string | null;
}

export interface Usuario {
  id: number;
  email: string;
  nomeCompleto: string;
  cpf?: string;
  contato?: string;
  situacao?: string;
  cargo: string;
  cargoNome?: string | null;
  fotoPerfil?: string | null;
  aceitouTermos: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

interface CreateUsuarioDTO {
  email: string;
  nomeCompleto: string;
  cargo: string;
  aceitouTermos: boolean;
}

function normalizeUsuario(usuario: UsuarioApi): Usuario {
  const cargo =
    usuario.cargoNome ||
    (typeof usuario.cargo === "string" ? usuario.cargo : usuario.cargo?.nome) ||
    "Sem cargo";

  return {
    id: usuario.id,
    email: usuario.email,
    nomeCompleto: usuario.nomeCompleto,
    cpf: usuario.cpf,
    contato: usuario.contato,
    situacao: usuario.situacao,
    cargo,
    cargoNome: usuario.cargoNome,
    fotoPerfil: usuario.fotoPerfil,
    aceitouTermos: usuario.aceitouTermos ?? false,
    dataCriacao: usuario.dataCriacao ?? "",
    dataAtualizacao: usuario.dataAtualizacao ?? "",
  };
}

function normalizeSolicitacaoAcesso(solicitacao: SolicitacaoAcessoApi): SolicitacaoAcesso {
  return {
    origem: solicitacao.origem,
    id: solicitacao.id,
    nomeCompleto: solicitacao.nomeCompleto || solicitacao.email,
    email: solicitacao.email,
    avatarUrl: solicitacao.avatarUrl,
    cpf: solicitacao.cpf,
    contato: solicitacao.contato,
    cargoNome: solicitacao.cargoNome,
    criadoEm: solicitacao.criadoEm,
    expiraEm: solicitacao.expiraEm,
  };
}

export function useUsuarios() {
  return useQuery<Usuario[]>({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const response = await api.get<UsuarioApi[]>("/usuarios");
      return response.data.map(normalizeUsuario);
    },
  });
}

export function useSolicitacoesAcesso() {
  return useQuery<SolicitacaoAcesso[]>({
    queryKey: ["usuarios", "pendentes"],
    queryFn: async () => {
      const response = await api.get<SolicitacaoAcessoApi[]>("/usuarios/pendentes");
      return response.data.map(normalizeSolicitacaoAcesso);
    },
  });
}

export function useUsuarioById(id: number) {
  return useQuery<Usuario>({
    queryKey: ["usuarios", id],
    queryFn: async () => {
      const response = await api.get<UsuarioApi>(`/usuarios/${id}`);
      return normalizeUsuario(response.data);
    },
    enabled: !!id,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUsuarioDTO) => {
      const response = await api.post<UsuarioApi>("/usuarios", data);
      return normalizeUsuario(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateUsuarioDTO> }) => {
      const response = await api.put<UsuarioApi>(`/usuarios/${id}`, data);
      return normalizeUsuario(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/usuarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useAprovarSolicitacaoAcesso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, origem }: { id: number; origem: OrigemSolicitacaoAcesso }) => {
      if (origem === "GOOGLE") {
        await api.post(`/usuarios/pendentes-google/${id}/aprovar`);
        return;
      }

      await api.post(`/usuarios/${id}/aprovar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios", "pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useRecusarSolicitacaoAcesso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, origem }: { id: number; origem: OrigemSolicitacaoAcesso }) => {
      if (origem === "GOOGLE") {
        await api.post(`/usuarios/pendentes-google/${id}/recusar`);
        return;
      }

      await api.post(`/usuarios/${id}/recusar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios", "pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}
