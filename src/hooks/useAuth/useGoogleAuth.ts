import { useMutation } from "@tanstack/react-query";
import { api } from "@/api";
import { beginGoogleLogin, googleLoginVerifier, clearGoogleLoginVerifier } from "@/lib/googleOAuthPkce";

interface ExchangeCodeResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    /** When present, sent as `X-Google-Access-Token` on agenda APIs for Calendar sync. */
    googleAccessToken?: string;
    /** Present when the user needs to complete registration (first access). */
    pendingToken?: string;
    usuario: {
      id: number;
      nomeCompleto: string;
      email: string;
      cargoNome: string;
      cargoId?: number;
      fotoPerfil?: string | null;
    };
  };
}

interface CompleteRegistrationDTO {
  pendingToken: string;
  cpf: string;
  contato: string;
  senha: string;
}

interface CompleteRegistrationResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    usuario: {
      id: number;
      nomeCompleto: string;
      cpf: string;
      email: string;
      contato: string;
      situacao: string;
      cargoNome: string;
      cargoId: number;
      fotoPerfil?: string | null;
    };
  };
}

export const useGoogleAuthUrl = () => {
  return useMutation({
    mutationFn: beginGoogleLogin,
  });
};

// Compartilha a troca durante remontagens/effects concorrentes (o código é de uso único).
const exchanges = new Map<string, Promise<ExchangeCodeResponse>>();
export function exchangeGoogleCode(code: string): Promise<ExchangeCodeResponse> {
  const pending = exchanges.get(code);
  if (pending) return pending;
  const exchange = (async () => {
    const codeVerifier = googleLoginVerifier();
    const response = await api.post<ExchangeCodeResponse>("/auth/exchange", { code, codeVerifier });
    clearGoogleLoginVerifier();
    return response.data;
  })();
  exchanges.set(code, exchange);
  // Nunca retém os tokens na memória além do período de troca do código.
  void exchange.then(
    () => { setTimeout(() => exchanges.delete(code), 60_000); },
    () => { exchanges.delete(code); },
  );
  return exchange;
}

export const useExchangeGoogleCode = () => {
  return useMutation({
    mutationFn: exchangeGoogleCode,
  });
};

export const useCompleteRegistration = () => {
  return useMutation({
    mutationFn: async (data: CompleteRegistrationDTO) => {
      const response = await api.post<CompleteRegistrationResponse>(
        "/usuarios/completar-cadastro",
        {
          cpf: data.cpf,
          contato: data.contato,
          senha: data.senha,
        },
        {
          headers: {
            Authorization: `Bearer ${data.pendingToken}`,
          },
        },
      );
      return response.data;
    },
  });
};
