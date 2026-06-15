import { api } from "@/api";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

export interface SignInCredentials {
  email: string;
  senha: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  /** OAuth access token for Google Calendar when the backend returns it on login. */
  googleAccessToken?: string;
  usuario?: {
    id?: number;
    email?: string;
    nomeCompleto?: string;
    fotoPerfil?: string | null;
  };
}

export const signInRequest = async (credentials: SignInCredentials) => {
  try {
    const response = await api.post("/auth/login", credentials);

    return response.data.data;
  } catch (error: unknown) {
    return Promise.reject(error);
  }
};

export const useSignIn = () => {
  return useMutation<Session, AxiosError, SignInCredentials>({
    mutationFn: signInRequest,
  });
};
