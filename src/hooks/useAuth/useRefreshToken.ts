import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { refreshAuthSession, type RefreshTokenResponse } from "@/lib/authSession";
export type { RefreshTokenResponse } from "@/lib/authSession";

export interface RefreshTokenRequest {
  refreshToken: string;
}


export const useRefreshToken = () => {
  return useMutation<RefreshTokenResponse, AxiosError, string>({
    mutationFn: () => refreshAuthSession(),
  });
};
