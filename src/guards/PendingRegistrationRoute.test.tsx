import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { PendingRegistrationRoute } from "./PendingRegistrationRoute";

const token = (claims: Record<string, unknown>) =>
  `header.${btoa(JSON.stringify(claims))}.signature`;

const renderRoute = () => render(
  <MemoryRouter initialEntries={["/first-access"]}>
    <Routes>
      <Route path="/" element={<p>Login</p>} />
      <Route path="/first-access" element={
        <PendingRegistrationRoute><p>Completar cadastro</p></PendingRegistrationRoute>
      } />
    </Routes>
  </MemoryRouter>,
);

describe("primeiro acesso Google", () => {
  afterEach(() => { cleanup(); sessionStorage.clear(); });

  it("permite completar o cadastro com token pendente e sem cookies de login", () => {
    sessionStorage.setItem("@CLIMB:PENDING_TOKEN", token({
      type: "pending_registration", pendingId: 42, exp: Date.now() / 1000 + 1800,
    }));
    renderRoute();
    expect(screen.getByText("Completar cadastro")).toBeInTheDocument();
  });

  it.each([
    null,
    "invalido",
    token({ type: "pending_registration", pendingId: 42, exp: 1 }),
    token({ type: "access", pendingId: 42, exp: Date.now() / 1000 + 1800 }),
  ])("retorna ao login quando não há token de cadastro válido: %s", (value) => {
    if (value) sessionStorage.setItem("@CLIMB:PENDING_TOKEN", value);
    renderRoute();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });
});
