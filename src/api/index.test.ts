import type { AxiosResponse } from "axios";
import { afterEach, describe, expect, it } from "vitest";

import { api } from "@/api";
import { ACCESS_TOKEN_COOKIE } from "@/lib/authCookies";

const readAuthorizationHeader = async (authorization?: string) => {
  const response = await api.get<string>("/auth-header-test", {
    headers: authorization ? { Authorization: authorization } : undefined,
    adapter: async (config): Promise<AxiosResponse<string>> => ({
      data: String(config.headers.Authorization ?? ""),
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }),
  });

  return response.data;
};

describe("interceptor de autenticação", () => {
  afterEach(() => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; Max-Age=0; path=/`;
  });

  it("preserva um token Authorization definido pela chamada", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=session-token; path=/`;

    await expect(readAuthorizationHeader("Bearer pending-token"))
      .resolves.toBe("Bearer pending-token");
  });

  it("usa o token da sessão quando a chamada não define Authorization", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=session-token; path=/`;

    await expect(readAuthorizationHeader()).resolves.toBe("Bearer session-token");
  });
});
