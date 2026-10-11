const VERIFIER_KEY = "CLIMB_GOOGLE_PKCE_VERIFIER";

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function beginGoogleLogin(): Promise<{ authorizationUrl: string }> {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64Url(new Uint8Array(digest));
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return { authorizationUrl: `${base}/auth/google/start?codeChallenge=${encodeURIComponent(challenge)}` };
}

export function googleLoginVerifier(): string {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("A autenticação não foi iniciada neste navegador. Entre novamente com Google.");
  return verifier;
}

export function clearGoogleLoginVerifier() { sessionStorage.removeItem(VERIFIER_KEY); }
