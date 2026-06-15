import { api } from "@/api";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

const refreshTokenRequest = async (
  refreshToken: string,
): Promise<RefreshTokenResponse> => {
  try {
    const response = await api.post("/auth/refresh", {
      refreshToken,
    });

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
