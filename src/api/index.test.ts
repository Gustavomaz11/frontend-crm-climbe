import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it } from "vitest";

import { api, setUnauthorizedCallback } from "@/api";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/authCookies";

const readAuthorizationHeader = async (authorization?: string) => {
  const response = await api.get<string>("/auth-header-test", {
    headers: authorization ? { Authorization: authorization } : undefined,
    adapter: async (config): Promise<AxiosResponse<string>> =>
      successfulResponse(config),
  });

  return response.data;
};

describe("interceptor de autenticacao", () => {
  afterEach(() => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; Max-Age=0; path=/`;
    document.cookie = `${REFRESH_TOKEN_COOKIE}=; Max-Age=0; path=/`;
    setUnauthorizedCallback(async () => false);
  });

  it("preserva um token Authorization definido pela chamada", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=session-token; path=/`;

    await expect(readAuthorizationHeader("Bearer pending-token"))
      .resolves.toBe("Bearer pending-token");
  });

  it("usa o token da sessao quando a chamada nao define Authorization", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=session-token; path=/`;

    await expect(readAuthorizationHeader()).resolves.toBe("Bearer session-token");
  });

  it("renova a sessao e repete a requisicao que recebeu 401", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=expired-token; path=/`;
    document.cookie = `${REFRESH_TOKEN_COOKIE}=valid-refresh-token; path=/`;
    let attempts = 0;

    setUnauthorizedCallback(async () => {
      document.cookie = `${ACCESS_TOKEN_COOKIE}=renewed-token; path=/`;
      return true;
    });

    const response = await api.get<string>("/protected", {
      adapter: async (config) => {
        attempts += 1;
        if (attempts === 1) {
          throwAuthenticationError(config, 401);
        }
        return successfulResponse(config);
      },
    });

    expect(response.data).toBe("Bearer renewed-token");
    expect(attempts).toBe(2);
  });

  it("renova em 403 quando o access token expirou", async () => {
    const expiredToken = createToken({ exp: Math.floor(Date.now() / 1000) - 60 });
    document.cookie = `${ACCESS_TOKEN_COOKIE}=${expiredToken}; path=/`;
    document.cookie = `${REFRESH_TOKEN_COOKIE}=valid-refresh-token; path=/`;
    let attempts = 0;

    setUnauthorizedCallback(async () => {
      document.cookie = `${ACCESS_TOKEN_COOKIE}=renewed-token; path=/`;
      return true;
    });

    const response = await api.get<string>("/protected", {
      adapter: async (config) => {
        attempts += 1;
        if (attempts === 1) {
          throwAuthenticationError(config, 403);
        }
        return successfulResponse(config);
      },
    });

    expect(response.data).toBe("Bearer renewed-token");
    expect(attempts).toBe(2);
  });

  it("nao tenta refresh em erro de login", async () => {
    document.cookie = `${REFRESH_TOKEN_COOKIE}=old-refresh-token; path=/`;
    let refreshAttempts = 0;
    setUnauthorizedCallback(async () => {
      refreshAttempts += 1;
      return true;
    });

    await expect(
      api.post("/auth/login", {}, {
        adapter: async (config) => throwAuthenticationError(config, 401),
      }),
    ).rejects.toBeInstanceOf(AxiosError);

    expect(refreshAttempts).toBe(0);
  });
});

const successfulResponse = (
  config: InternalAxiosRequestConfig,
): AxiosResponse<string> => ({
  data: String(config.headers.Authorization ?? ""),
  status: 200,
  statusText: "OK",
  headers: {},
  config,
});

const throwAuthenticationError = (
  config: InternalAxiosRequestConfig,
  status: number,
): never => {
  const response: AxiosResponse = {
    data: {},
    status,
    statusText: status === 401 ? "Unauthorized" : "Forbidden",
    headers: {},
    config,
  };
  throw new AxiosError(
    "Authentication error",
    "ERR_BAD_RESPONSE",
    config,
    undefined,
    response,
  );
};

const createToken = (payload: Record<string, unknown>) => {
  const encode = (value: object) =>
    window.btoa(JSON.stringify(value)).replaceAll("=", "");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.`;
};
