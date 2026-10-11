import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseCookies } from "nookies";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, clearAuthCookies, saveRefreshToken } from "@/lib/authCookies";
import { refreshAuthSession, revokeAuthSession } from "@/lib/authSession";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("axios", () => ({ default: { create: () => ({ post }) } }));

describe("sessões com refresh rotativo", () => {
  beforeEach(() => { post.mockReset(); clearAuthCookies(); });
  afterEach(() => { clearAuthCookies(); });

  it("agrupa chamadas simultâneas e grava os dois tokens retornados", async () => {
    saveRefreshToken("refresh-anterior");
    post.mockResolvedValue({ data: { data: { accessToken: "access-novo", refreshToken: "refresh-novo", expiresIn: 7200000 } } });
    const [first, second] = await Promise.all([refreshAuthSession(), refreshAuthSession()]);
    expect(first).toEqual(second);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/auth/refresh", { refreshToken: "refresh-anterior" });
    expect(parseCookies()[ACCESS_TOKEN_COOKIE]).toBe("access-novo");
    expect(parseCookies()[REFRESH_TOKEN_COOKIE]).toBe("refresh-novo");
    await refreshAuthSession();
    expect(post).toHaveBeenLastCalledWith("/auth/refresh", { refreshToken: "refresh-novo" });
  });

  it("não grava resposta atrasada de refresh depois de sair", async () => {
    saveRefreshToken("refresh-anterior");
    let finish!: (value: unknown) => void;
    post.mockImplementation((path) => path === "/auth/refresh"
      ? new Promise(resolve => { finish = resolve; }) : Promise.resolve({}));
    const refresh = refreshAuthSession();
    await revokeAuthSession();
    clearAuthCookies();
    finish({ data: { data: { accessToken: "access-atrasado", refreshToken: "refresh-atrasado", expiresIn: 7200000 } } });
    await expect(refresh).rejects.toThrow("Sessão encerrada");
    expect(parseCookies()[ACCESS_TOKEN_COOKIE]).toBeUndefined();
    expect(parseCookies()[REFRESH_TOKEN_COOKIE]).toBeUndefined();
    expect(post).toHaveBeenCalledWith("/auth/logout", { refreshToken: "refresh-anterior" });
  });

  it("rejeita resposta incompleta sem sobrescrever os cookies", async () => {
    saveRefreshToken("refresh-anterior");
    post.mockResolvedValue({ data: { data: { accessToken: "access-sem-refresh", expiresIn: 7200000 } } });
    await expect(refreshAuthSession()).rejects.toThrow("Não foi possível renovar");
    expect(parseCookies()[ACCESS_TOKEN_COOKIE]).toBeUndefined();
    expect(parseCookies()[REFRESH_TOKEN_COOKIE]).toBe("refresh-anterior");
  });

  it("lê o token atualizado dentro do lock de outra aba", async () => {
    saveRefreshToken("refresh-antigo");
    Object.defineProperty(navigator, "locks", { configurable: true, value: {
      request: vi.fn(async (_name, callback) => { saveRefreshToken("rotacionado-na-outra-aba"); return callback(); }),
    } });
    post.mockResolvedValue({ data: { data: { accessToken: "access-novo", refreshToken: "refresh-novo", expiresIn: 7200000 } } });
    try {
      await refreshAuthSession();
      expect(post).toHaveBeenCalledWith("/auth/refresh", { refreshToken: "rotacionado-na-outra-aba" });
    } finally { Object.defineProperty(navigator, "locks", { configurable: true, value: undefined }); }
  });
});
