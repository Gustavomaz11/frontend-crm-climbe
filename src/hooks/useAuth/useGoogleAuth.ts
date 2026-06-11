import { useMutation } from "@tanstack/react-query";
import { api } from "@/api";

interface GoogleAuthUrlResponse {
  authorizationUrl: string;
}

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
    };
  };
}

interface CompleteRegistrationDTO {
  pendingToken: string;
  cpf: string;
  contato: string;
  senha: string;
  cargoId: number;
}

interface CompleteRegistrationResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    usuario: {
      id: number;
      nomeCompleto: string;
      cpf: string;
      email: string;
      contato: string;
      situacao: string;
      cargoNome: string;
      cargoId: number;
    };
  };
}

export const useGoogleAuthUrl = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get<GoogleAuthUrlResponse>("/auth/google/url");
      return response.data;
    },
  });
};

export const useExchangeGoogleCode = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post<ExchangeCodeResponse>("/auth/exchange", {
        code,
      });
      return response.data;
    },
  });
};

export const useCompleteRegistration = () => {
  return useMutation({
    mutationFn: async (data: CompleteRegistrationDTO) => {
      const response = await api.post<CompleteRegistrationResponse>(
        "/auth/google/complete-registration",
        data
      );
      return response.data;
    },
  });
};
