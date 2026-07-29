import { describe, expect, it } from "vitest";

import { expirationMillisecondsToSeconds } from "@/lib/authCookies";

describe("cookies de autenticacao", () => {
  it("converte a validade da API de milissegundos para segundos", () => {
    expect(expirationMillisecondsToSeconds(7_200_000)).toBe(7_200);
  });
});
