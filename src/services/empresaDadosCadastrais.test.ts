import { describe, expect, it } from "vitest";
import { completarDadosCadastrais, semHistoricos, situacaoEmpresa } from "./empresaDadosCadastrais";
import { empresaToForm, normalizeEmpresa, sanitizeEmpresaPayload } from "./useEmpresas";

describe("dados cadastrais atuais", () => {
  it("remove históricos e links de documentos, preservando sócios, inscrições e incentivos", () => {
    const dados = { company: { members: [{ person: { name: "Ana" } }], simples: { optant: true, since: "2024-01-01", history: [{ since: "2000-01-01" }] } }, registrations: [{ number: "12345678", state: "SE" }], suframa: { incentives: [{ text: "Isenção" }] }, links: ["pdf"] };
    const atual = semHistoricos(dados);
    expect(JSON.stringify(atual)).not.toMatch(/history|2000|pdf/);
    expect(JSON.stringify(atual)).toMatch(/Ana/);
    expect(JSON.stringify(atual)).toMatch(/12345678/);
    expect(JSON.stringify(atual)).toMatch(/Isenção/);
  });
  it("mantém todos os novos campos na edição e no payload de salvamento", () => {
    const dados = completarDadosCadastrais({ status: { id: 8, text: "Baixada" } });
    const form = empresaToForm(normalizeEmpresa({ id: 7, tipoEmpresa: "LUCRO_REAL", dadosCadastrais: dados }));
    const payload = sanitizeEmpresaPayload(form);
    expect(payload.tipoEmpresa).toBe("LUCRO_REAL");
    expect(payload.dadosCadastrais).toEqual(dados);
    expect(situacaoEmpresa(dados)).toEqual({ texto: "Baixada", inativa: true });
    expect(situacaoEmpresa()).toEqual({ texto: "Não informada", inativa: false });
  });
});
