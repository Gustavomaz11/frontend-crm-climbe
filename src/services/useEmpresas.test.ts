import { describe, expect, it } from "vitest";
import {
  empresaToForm,
  normalizeEmpresa,
  sanitizeEmpresaPayload,
  type CreateEmpresaDTO,
} from "./useEmpresas";

const empresaPayload: CreateEmpresaDTO = {
  razaoSocial: "  Climbe Serviços Ltda.  ",
  nomeFantasia: "  Climbe  ",
  cnpj: "  12.345.678/0001-90  ",
  logradouro: "  Avenida Central  ",
  numero: "  100  ",
  bairro: "  Centro  ",
  cidade: "  Salvador  ",
  uf: "  BA  ",
  cep: "  40000-000  ",
  telefone: "  (71) 99999-9999  ",
  email: "  contato@climbe.com.br  ",
  representanteNome: "  Gustavo  ",
  representanteCpf: "  000.000.000-00  ",
  representanteContato: "  gustavo@climbe.com.br  ",
};

describe("dados de empresa", () => {
  it("normaliza todos os campos retornados pela API", () => {
    const empresa = normalizeEmpresa({ id: 7, ...empresaPayload });

    expect(empresa.id).toBe(7);
    expect(empresa.nome).toBe("  Climbe  ");
    expect(empresa.numero).toBe("  100  ");
    expect(empresa.representanteNome).toBe("  Gustavo  ");
  });

  it("preenche o formulário de edição com os dados existentes", () => {
    const form = empresaToForm(normalizeEmpresa({ id: 7, ...empresaPayload }));

    expect(form).toEqual(empresaPayload);
  });

  it("remove espaços externos antes de criar ou atualizar", () => {
    const sanitized = sanitizeEmpresaPayload(empresaPayload);

    expect(sanitized.razaoSocial).toBe("Climbe Serviços Ltda.");
    expect(sanitized.email).toBe("contato@climbe.com.br");
    expect(sanitized.representanteContato).toBe("gustavo@climbe.com.br");
  });
});
