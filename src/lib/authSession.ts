import axios from "axios";
import { parseCookies } from "nookies";
import { REFRESH_TOKEN_COOKIE, saveAccessToken, saveRefreshToken } from "@/lib/authCookies";

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const sessionApi = axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: 15_000 });
let pendingRefresh: Promise<RefreshTokenResponse> | null = null;
let sessionGeneration = 0;

export function invalidatePendingRefresh() {
  sessionGeneration += 1;
}

export function refreshAuthSession(): Promise<RefreshTokenResponse> {
  if (pendingRefresh) return pendingRefresh;
  const generation = sessionGeneration;
  const refresh = async () => {
    // Leia dentro do lock: outra aba pode ter rotacionado o token enquanto esta aguardava.
    const refreshToken = parseCookies()[REFRESH_TOKEN_COOKIE];
    if (!refreshToken || generation !== sessionGeneration) throw new Error("Sessão encerrada.");
    const response = await sessionApi.post<{ data: RefreshTokenResponse }>("/auth/refresh", { refreshToken });
    const data = response.data.data;
    if (generation !== sessionGeneration) throw new Error("Sessão encerrada.");
    if (!data?.accessToken || !data?.refreshToken || !(data.expiresIn > 0)) {
      throw new Error("Não foi possível renovar sua sessão.");
    }
    saveAccessToken(data.accessToken, data.expiresIn);
    saveRefreshToken(data.refreshToken);
    return data;
  };
  const operation = navigator.locks
    ? navigator.locks.request("climb-auth-refresh", refresh)
    : refresh();
  pendingRefresh = operation.finally(() => { pendingRefresh = null; });
  return pendingRefresh;
}

export async function revokeAuthSession() {
  invalidatePendingRefresh();
  const refreshToken = parseCookies()[REFRESH_TOKEN_COOKIE];
  if (refreshToken) await sessionApi.post("/auth/logout", { refreshToken });
}
