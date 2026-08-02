import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserIdentity, getUserRole } from "./UserSelect";

describe("identificação visual de usuário", () => {
  it("mostra avatar, nome e cargo na hierarquia esperada", () => {
    render(
      <UserIdentity
        user={{
          id: 7,
          nomeCompleto: "Ana Souza",
          cargo: "Analista Sênior",
          fotoPerfil: "https://example.com/ana.jpg",
        }}
      />,
    );

    expect(screen.getByText("AS")).toBeInTheDocument();
    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    expect(screen.getByText("Analista Sênior")).toBeInTheDocument();
  });

  it("prioriza cargoNome e informa quando o cargo estiver ausente", () => {
    expect(getUserRole({ id: 1, nomeCompleto: "João", cargo: "Legado", cargoNome: "CEO" }))
      .toBe("CEO");
    expect(getUserRole({ id: 2, nomeCompleto: "Maria" })).toBe("Sem cargo informado");
  });
});
