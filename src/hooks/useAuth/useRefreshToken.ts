import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

const refreshApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshTokenRequest = async (
  refreshToken: string,
): Promise<RefreshTokenResponse> => {
  try {
    const response = await refreshApi.post("/auth/refresh", {
      refreshToken,
    });

    // A API retorna: { success, data: { accessToken, expiresIn }, message, timestamp }
    return response.data.data;
  } catch (error: unknown) {
    return Promise.reject(error);
  }
};

export const useRefreshToken = () => {
  return useMutation<RefreshTokenResponse, AxiosError, string>({
    mutationFn: refreshTokenRequest,
  });
};
