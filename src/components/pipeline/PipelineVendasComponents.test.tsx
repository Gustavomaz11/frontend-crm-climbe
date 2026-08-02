import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PipelineNegocioCard } from "./PipelineNegocioCard";
import {
  PipelineNegocioFormFields,
} from "./PipelineNegocioFormFields";
import {
  estrategiaComercialOptions,
  origemNegocioOptions,
  servicoInteresseOptions,
} from "./pipelineNegocioOptions";
import {
  draftToNegocioInput,
  emptyPipelineNegocioDraft,
  isPipelineNegocioDraftValid,
  negocioToDraft,
} from "./pipelineNegocioForm";
import type { PipelineNegocio } from "@/services/usePipelineVendas";
import { normalizeEmpresa } from "@/services/useEmpresas";

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

  it("informa que o negócio está sendo salvo após a movimentação", () => {
    render(
      <PipelineNegocioCard
        negocio={negocio}
        canMove={false}
        isMoving
        onOpen={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );

    expect(screen.getByText("Salvando...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
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

  it("oferece listas fechadas para origem, serviço e estratégia comercial", () => {
    render(
      <PipelineNegocioFormFields
        draft={emptyPipelineNegocioDraft}
        setDraft={vi.fn()}
        empresas={[]}
        usuarios={[]}
        etapas={[]}
        disabled={false}
      />,
    );

    expect(screen.getByLabelText("Origem do negócio *").tagName).toBe("SELECT");
    expect(screen.getByLabelText("Serviço de interesse *").tagName).toBe("SELECT");
    expect(screen.getByLabelText("Estratégia comercial *").tagName).toBe("SELECT");
    origemNegocioOptions.forEach((option) =>
      expect(screen.getByRole("option", { name: option })).toBeInTheDocument(),
    );
    servicoInteresseOptions.forEach((option) =>
      expect(screen.getByRole("option", { name: option })).toBeInTheDocument(),
    );
    estrategiaComercialOptions.forEach((option) =>
      expect(screen.getByRole("option", { name: option })).toBeInTheDocument(),
    );
  });

  it("preenche os dados de contato ao selecionar uma empresa cadastrada", () => {
    const setDraft = vi.fn();
    const empresa = normalizeEmpresa({
      id: 7,
      nomeFantasia: "Jota",
      representanteNome: "Gustavo Machado Trindade",
      telefone: "79996701239",
      email: "gustavo.trindade@jotanunes.com",
    });

    render(
      <PipelineNegocioFormFields
        draft={emptyPipelineNegocioDraft}
        setDraft={setDraft}
        empresas={[empresa]}
        usuarios={[]}
        etapas={[]}
        disabled={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Empresa cadastrada"), {
      target: { value: "7" },
    });

    const applyDraftUpdate = setDraft.mock.calls[0][0];
    expect(applyDraftUpdate(emptyPipelineNegocioDraft)).toMatchObject({
      empresaId: "7",
      nomeEmpresa: "Jota",
      nomeContato: "Gustavo Machado Trindade",
      telefone: "79996701239",
      email: "gustavo.trindade@jotanunes.com",
    });
  });

  it("normaliza opções legadas e rejeita valores fora das listas", () => {
    const draft = negocioToDraft({
      ...negocio,
      origemNegocio: "site",
      estrategiaComercial: "Diagnóstico consultivo",
      servicoInteresse: "M&A",
    });

    expect(draft.origemNegocio).toBe("Site");
    expect(draft.estrategiaComercial).toBe("");
    expect(draft.servicoInteresse).toBe("");
  });
});
