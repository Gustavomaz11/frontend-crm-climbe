import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PipelineNegocioCard } from "./PipelineNegocioCard";
import {
  draftToNegocioInput,
  emptyPipelineNegocioDraft,
  isPipelineNegocioDraftValid,
} from "./pipelineNegocioForm";
import type { PipelineNegocio } from "@/services/usePipelineVendas";

const negocio: PipelineNegocio = {
  id: 1,
  nomeEmpresa: "Apex Ventures",
  nomeContato: "Maria Silva",
  telefone: "11999999999",
  email: "maria@apex.com",
  responsavelId: 1,
  responsavelNome: "Usuário de Teste",
  etapaId: 1,
  etapaCodigo: "REUNIAO_MARCADA",
  etapaNome: "Reunião marcada",
  origemNegocio: "Indicação",
  estrategiaComercial: "Diagnóstico consultivo",
  servicoInteresse: "M&A",
  valorEstimadoProposta: 150000,
  resultado: "ABERTO",
  criadoEm: "2026-07-28T10:00:00",
  ultimaMovimentacaoEm: "2026-07-28T10:00:00",
};

describe("Pipeline de Vendas", () => {
  it("exibe as informações essenciais do card e abre os detalhes", () => {
    const onOpen = vi.fn();
    render(<PipelineNegocioCard negocio={negocio} canMove onOpen={onOpen} onDragStart={vi.fn()} />);

    expect(screen.getByText("Apex Ventures")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText(/150.000/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("exige os campos comerciais essenciais", () => {
    expect(isPipelineNegocioDraftValid(emptyPipelineNegocioDraft)).toBe(false);
    expect(isPipelineNegocioDraftValid({
      ...emptyPipelineNegocioDraft,
      nomeEmpresa: "Apex Ventures",
      nomeContato: "Maria Silva",
      telefone: "11999999999",
      email: "maria@apex.com",
      responsavelId: "1",
      origemNegocio: "Indicação",
      estrategiaComercial: "Diagnóstico consultivo",
      servicoInteresse: "M&A",
    })).toBe(true);
  });

  it("normaliza o formulário para o payload da API", () => {
    const payload = draftToNegocioInput({
      ...emptyPipelineNegocioDraft,
      empresaId: "2",
      nomeEmpresa: " Apex Ventures ",
      nomeContato: " Maria Silva ",
      telefone: " 11999999999 ",
      email: " maria@apex.com ",
      responsavelId: "1",
      etapaId: "3",
      origemNegocio: " Indicação ",
      estrategiaComercial: " Diagnóstico ",
      servicoInteresse: " M&A ",
      valorEstimadoProposta: "150000",
    });

    expect(payload).toMatchObject({
      empresaId: 2,
      nomeEmpresa: "Apex Ventures",
      responsavelId: 1,
      etapaId: 3,
      valorEstimadoProposta: 150000,
    });
  });
});
