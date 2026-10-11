import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { beginGoogleLogin, googleLoginVerifier } from "@/lib/googleOAuthPkce";
import { exchangeGoogleCode } from "@/hooks/useAuth/useGoogleAuth";
const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/api", () => ({ api: { post } }));

describe("OAuth vinculado ao navegador com PKCE", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", webcrypto);
    sessionStorage.clear(); post.mockReset();
  });
  afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear(); });

  it("gera segredo aleatório e envia apenas seu hash ao iniciar", async () => {
    const flow = await beginGoogleLogin();
    const verifier = googleLoginVerifier();
    const url = new URL(flow.authorizationUrl, window.location.origin);
    const challenge = url.searchParams.get("codeChallenge");
    expect(verifier).toMatch(/^[\w-]{43}$/);
    expect(challenge).toMatch(/^[\w-]{43}$/);
    const digest = await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    expect(challenge).toBe(Buffer.from(digest).toString("base64url"));
    expect(flow.authorizationUrl).not.toContain(verifier);
    expect(url.pathname).toContain("/auth/google/start");
    await beginGoogleLogin();
    expect(googleLoginVerifier()).not.toBe(verifier);
  });

  it("recusa código recebido sem login iniciado neste navegador", async () => {
    await expect(exchangeGoogleCode("code-sem-verifier")).rejects.toThrow("não foi iniciada neste navegador");
    expect(post).not.toHaveBeenCalled();
  });

  it("envia o verifier e agrupa troca concorrente do código de uso único", async () => {
    await beginGoogleLogin(); const verifier = googleLoginVerifier();
    post.mockResolvedValue({ data: { success: true, data: { accessToken: "token" } } });
    const [first, second] = await Promise.all([exchangeGoogleCode("code-unico"), exchangeGoogleCode("code-unico")]);
    expect(first).toEqual(second);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/auth/exchange", { code: "code-unico", codeVerifier: verifier });
    expect(() => googleLoginVerifier()).toThrow("não foi iniciada");
  });
});
