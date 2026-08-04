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

export interface Cargo {
  id: number;
  nome: string;
  ativo?: boolean;
  cargoSuperiorId?: number | null;
  ordemHierarquia?: number;
  grupoId?: number | null;
}

export interface GrupoCargo {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
}

export interface CargoHierarquiaItem {
  cargoId: number;
  cargoSuperiorId: number | null;
  ordem: number;
}

export interface AtualizarMeuPerfilDTO {
  nomeCompleto: string;
  email: string;
  cpf: string;
  contato: string;
}

export type OrigemSolicitacaoAcesso = "USUARIO" | "GOOGLE";

export interface AprovarSolicitacaoAcessoDTO {
  id: number;
  origem: OrigemSolicitacaoAcesso;
  cargoId: number;
  permissaoIds: number[];
}

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
  status: "PENDENTE" | "APROVADO" | "RECUSADO";
  decididoEm?: string | null;
  decididoPor?: number | null;
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
  status: "PENDENTE" | "APROVADO" | "RECUSADO";
  decididoEm?: string | null;
  decididoPor?: number | null;
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
  cpf: string;
  contato: string;
  senha: string;
  cargoId: number;
}

export interface SolicitarAcessoUsuarioDTO {
  nomeCompleto: string;
  cpf: string;
  email: string;
  contato: string;
  senha: string;
  cargoId: number;
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
    status: solicitacao.status,
    decididoEm: solicitacao.decididoEm,
    decididoPor: solicitacao.decididoPor,
  };
}

export function useUsuarios(enabled = true) {
  return useQuery<Usuario[]>({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const response = await api.get<UsuarioApi[]>("/usuarios");
      return response.data.map(normalizeUsuario);
    },
    enabled,
  });
}

export function useCargos() {
  return useQuery<Cargo[]>({
    queryKey: ["cargos"],
    queryFn: async () => {
      const response = await api.get<Cargo[]>("/cargos");
      return response.data;
    },
  });
}

export function useSolicitacoesAcesso() {
  return useQuery<SolicitacaoAcesso[]>({
    queryKey: ["usuarios", "solicitacoes"],
    queryFn: async () => {
      const response = await api.get<SolicitacaoAcessoApi[]>("/usuarios/solicitacoes");
      return response.data.map(normalizeSolicitacaoAcesso);
    },
  });
}

export function useGruposCargos() {
  return useQuery<GrupoCargo[]>({
    queryKey: ["grupos-cargos"],
    queryFn: async () => {
      const response = await api.get<GrupoCargo[]>("/grupos-cargos");
      return response.data;
    },
  });
}

export function useCreateCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ nome, grupoId }: { nome: string; grupoId?: number | null }) => {
      const response = await api.post<Cargo>("/cargos", { nome, grupoId });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cargos"] }),
  });
}

export function useCreateGrupoCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string | null }) => {
      const response = await api.post<GrupoCargo>("/grupos-cargos", data);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos-cargos"] }),
  });
}

export function useUpdateGrupoCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; nome: string; descricao?: string | null }) => {
      const response = await api.put<GrupoCargo>(`/grupos-cargos/${id}`, data);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos-cargos"] }),
  });
}

export function useDeleteGrupoCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/grupos-cargos/${id}`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["grupos-cargos"] }),
        queryClient.invalidateQueries({ queryKey: ["cargos"] }),
      ]);
    },
  });
}

export function useAssignCargoGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cargoId, grupoId }: { cargoId: number; grupoId: number | null }) => {
      const response = await api.put<Cargo>(`/grupos-cargos/cargos/${cargoId}`, { grupoId });
      return response.data;
    },
    onSuccess: (cargo) => {
      queryClient.setQueryData<Cargo[]>(["cargos"], (current = []) =>
        current.map((item) => item.id === cargo.id ? cargo : item));
    },
  });
}

export function useUpdateCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nome }: { id: number; nome: string }) => {
      const response = await api.put<Cargo>(`/cargos/${id}`, { nome });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cargos"] }),
  });
}

export function useDeleteCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/cargos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cargos"] }),
  });
}

export function useUpdateCargoHierarchy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cargos: CargoHierarquiaItem[]) => {
      const response = await api.put<Cargo[]>("/cargos/hierarquia", { cargos });
      return response.data;
    },
    onSuccess: (cargos) => {
      queryClient.setQueryData(["cargos"], cargos);
    },
  });
}

export function useMeuPerfil() {
  return useQuery<Usuario>({
    queryKey: ["usuarios", "me"],
    queryFn: async () => {
      const response = await api.get<UsuarioApi>("/usuarios/me");
      return normalizeUsuario(response.data);
    },
  });
}

export function useAtualizarMeuPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AtualizarMeuPerfilDTO) => {
      const response = await api.put<UsuarioApi>("/usuarios/me", data);
      return normalizeUsuario(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios", "me"] });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useAtualizarFotoPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (foto: File) => {
      const formData = new FormData();
      formData.append("foto", foto);
      const response = await api.post<UsuarioApi>("/usuarios/me/foto", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return normalizeUsuario(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios", "me"] });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useAcessosUsuarios() {
  return useQuery<Usuario[]>({
    queryKey: ["usuarios", "acessos"],
    queryFn: async () => {
      const response = await api.get<UsuarioApi[]>("/usuarios/acessos");
      return response.data.map(normalizeUsuario);
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
      const response = await api.post<string>("/usuarios", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["usuarios", "solicitacoes"] });
    },
  });
}

export function useSolicitarAcessoUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SolicitarAcessoUsuarioDTO) => {
      const response = await api.post<string>("/usuarios", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios", "solicitacoes"] });
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
    mutationFn: async ({ id, origem, cargoId, permissaoIds }: AprovarSolicitacaoAcessoDTO) => {
      const atribuicao = { cargoId, permissaoIds };

      if (origem === "GOOGLE") {
        await api.post(`/usuarios/pendentes-google/${id}/aprovar`, atribuicao);
        return;
      }

      await api.post(`/usuarios/${id}/aprovar`, atribuicao);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios", "solicitacoes"] });
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
      queryClient.invalidateQueries({ queryKey: ["usuarios", "solicitacoes"] });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useRevogarAcesso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/usuarios/${id}/revogar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["usuarios", "acessos"] });
    },
  });
}

export function useReativarAcesso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/usuarios/${id}/reativar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["usuarios", "acessos"] });
    },
  });
}

export function useAlterarCargoUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cargoId }: { id: number; cargoId: number }) => {
      await api.patch(`/usuarios/${id}/cargo`, { cargoId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}
