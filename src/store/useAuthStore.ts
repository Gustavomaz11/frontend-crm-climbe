import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Pessoa {
  id: number;
  cpfCnpj: string;
  nomeCompleto: string;
  nomeMae: string | null;
  nomePai: string | null;
  sexo: string | null;
  dataNascimento: string | null;
  telefone: string | null;
  email: string;
  fotoPerfil?: string | null;
  rgInscricaoSocial: string | null;
}

export interface UserData {
  id: number;
  email: string;
  aceitouTermos: boolean;
  cargo: string;
  dataCriacao: string;
  dataAtualizacao: string;
  nomeCompleto: string;
  fotoPerfil?: string | null;
  pessoa: Pessoa;
}

export interface BasicUserData {
  id?: number;
  email?: string;
  nomeCompleto?: string;
  fotoPerfil?: string | null;
}

interface AuthState {
  userData: UserData | null;
  basicUserData: BasicUserData | null;
  setUserData: (userData: UserData) => void;
  setBasicUserData: (userData: BasicUserData) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userData: null,
      basicUserData: null,

      setUserData: (userData) => {
        set({ userData });
      },

      setBasicUserData: (basicUserData) => {
        set({ basicUserData });
      },

      clearSession: () => {
        set({ userData: null, basicUserData: null });
      },
    }),
    {
      name: "session",
    }
  )
);

export const useAuthEmail = () =>
  useAuthStore((s) => s.userData?.pessoa?.email ?? s.userData?.email ?? "");
