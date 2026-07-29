import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";
import { parseCookies } from "nookies";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/authCookies";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface DecodedAccessToken {
  exp?: number;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: {
    indexes: true,
  },
});

api.interceptors.request.use((config) => {
  const cookies = parseCookies();
  const token = cookies[ACCESS_TOKEN_COOKIE];

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorizedCallback: (() => Promise<boolean>) | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: boolean) => void;
  reject: (error: unknown) => void;
}> = [];

export const setUnauthorizedCallback = (callback: () => Promise<boolean>) => {
  onUnauthorizedCallback = callback;
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(!!token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

const isExpiredAccessToken = (token?: string) => {
  if (!token) return true;

  try {
    const { exp } = jwtDecode<DecodedAccessToken>(token);
    return !exp || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const isPublicAuthRequest = (url?: string) =>
  Boolean(url && /^\/?auth\//.test(url));

const shouldRefreshSession = (
  error: AxiosError,
  originalRequest?: RetryableRequestConfig,
) => {
  if (!originalRequest || originalRequest._retry || isPublicAuthRequest(originalRequest.url)) {
    return false;
  }

  const status = error.response?.status;
  const cookies = parseCookies();
  const refreshToken = cookies[REFRESH_TOKEN_COOKIE];
  if (!refreshToken) return false;

  if (status === 401) return true;
  if (status !== 403) return false;

  return isExpiredAccessToken(cookies[ACCESS_TOKEN_COOKIE]);
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (shouldRefreshSession(error, originalRequest)) {
      if (isRefreshing) {
        // Se já está refrescando, adicionar à fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((success) => {
          if (success) {
            // Se refresh foi bem-sucedido, pegar o novo token e re-tentar
            const cookies = parseCookies();
            const token = cookies[ACCESS_TOKEN_COOKIE];
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
          return Promise.reject(error);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Chamar callback de refresh
        if (onUnauthorizedCallback) {
          const refreshed = await onUnauthorizedCallback();

          if (refreshed) {
            // Refresh bem-sucedido, processar fila e re-tentar
            const cookies = parseCookies();
            const token = cookies[ACCESS_TOKEN_COOKIE];
            originalRequest.headers.Authorization = `Bearer ${token}`;
            processQueue(null, token);
            return api(originalRequest);
          } else {
            // Refresh falhou, rejeitar
            processQueue(error, null);
            return Promise.reject(error);
          }
        }

        processQueue(error, null);
        return Promise.reject(error);
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export { api };
