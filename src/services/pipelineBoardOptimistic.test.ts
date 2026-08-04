import { describe, expect, it } from "vitest";
import type { PipelineBoard, PipelineNegocio } from "./usePipelineVendas";
import { movePipelineNegocioInBoard } from "./usePipelineVendas";

const business: PipelineNegocio = {
  id: 10,
  funilId: 1,
  funilNome: "Funil comercial",
  nomeEmpresa: "Jota",
  nomeContato: "Gustavo",
  telefone: "79999999999",
  email: "contato@jota.com",
  responsavelId: 1,
  responsavelNome: "Gustavo Trindade",
  etapaId: 1,
  etapaCodigo: "REUNIAO_MARCADA",
  etapaNome: "Reunião marcada",
  origemNegocio: "Indicação",
  estrategiaComercial: "Ativa",
  servicoInteresse: "BPO",
  resultado: "ABERTO",
  possuiProposta: false,
  propostaAjustesPendentes: false,
  criadoEm: "2026-08-02T10:00:00",
  ultimaMovimentacaoEm: "2026-08-02T10:00:00",
};

const board: PipelineBoard = {
  funilId: 1,
  funilNome: "Funil comercial",
  etapas: [
    {
      id: 1,
      codigo: "REUNIAO_MARCADA",
      nome: "Reunião marcada",
      posicao: 1,
      resultado: "ABERTO",
      camposObrigatorios: [],
      negocios: [business],
    },
    {
      id: 2,
      codigo: "REUNIAO_REALIZADA",
      nome: "Reunião realizada",
      posicao: 2,
      resultado: "ABERTO",
      camposObrigatorios: [],
      negocios: [],
    },
  ],
};

describe("movimentação otimista do Pipeline", () => {
  it("move o negócio imediatamente para a etapa de destino sem alterar o estado anterior", () => {
    const updated = movePipelineNegocioInBoard(board, 10, 2);

    expect(updated.etapas[0].negocios).toHaveLength(0);
    expect(updated.etapas[1].negocios[0]).toMatchObject({
      id: 10,
      etapaId: 2,
      etapaCodigo: "REUNIAO_REALIZADA",
      etapaNome: "Reunião realizada",
    });
    expect(board.etapas[0].negocios).toHaveLength(1);
    expect(board.etapas[1].negocios).toHaveLength(0);
  });
});
