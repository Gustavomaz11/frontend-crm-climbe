import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { beginGoogleLogin } from "@/lib/googleOAuthPkce";
import ConviteGoogle from "./ConviteGoogle";

vi.mock("@/lib/googleOAuthPkce", () => ({ beginGoogleLogin: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

it("inicia o fluxo Google uma única vez mesmo com remontagem de effects e permite tentar novamente em caso de erro", async () => {
  vi.mocked(beginGoogleLogin).mockRejectedValue(new Error("PKCE indisponível"));
  render(<StrictMode><MemoryRouter><ConviteGoogle /></MemoryRouter></StrictMode>);
  await waitFor(() => expect(beginGoogleLogin).toHaveBeenCalledTimes(1));
  expect(await screen.findByRole("button", { name: "Continuar com Google" })).toBeEnabled();
});
