import type { PipelineNegocio, PipelineNegocioInput } from "@/services/usePipelineVendas";

export interface PipelineNegocioDraft {
  empresaId: string;
  nomeEmpresa: string;
  nomeContato: string;
  telefone: string;
  email: string;
  responsavelId: string;
  etapaId: string;
  dataReuniao: string;
  origemNegocio: string;
  estrategiaComercial: string;
  servicoInteresse: string;
  valorEstimadoProposta: string;
  observacoes: string;
}

export const emptyPipelineNegocioDraft: PipelineNegocioDraft = {
  empresaId: "",
  nomeEmpresa: "",
  nomeContato: "",
  telefone: "",
  email: "",
  responsavelId: "",
  etapaId: "",
  dataReuniao: "",
  origemNegocio: "",
  estrategiaComercial: "",
  servicoInteresse: "",
  valorEstimadoProposta: "",
  observacoes: "",
};

export const negocioToDraft = (negocio: PipelineNegocio): PipelineNegocioDraft => ({
  empresaId: negocio.empresaId ? String(negocio.empresaId) : "",
  nomeEmpresa: negocio.nomeEmpresa,
  nomeContato: negocio.nomeContato,
  telefone: negocio.telefone,
  email: negocio.email,
  responsavelId: String(negocio.responsavelId),
  etapaId: String(negocio.etapaId),
  dataReuniao: negocio.dataReuniao?.slice(0, 16) || "",
  origemNegocio: negocio.origemNegocio,
  estrategiaComercial: negocio.estrategiaComercial,
  servicoInteresse: negocio.servicoInteresse,
  valorEstimadoProposta: negocio.valorEstimadoProposta ? String(negocio.valorEstimadoProposta) : "",
  observacoes: negocio.observacoes || "",
});

export const draftToNegocioInput = (draft: PipelineNegocioDraft): PipelineNegocioInput => ({
  empresaId: draft.empresaId ? Number(draft.empresaId) : null,
  nomeEmpresa: draft.nomeEmpresa.trim(),
  nomeContato: draft.nomeContato.trim(),
  telefone: draft.telefone.trim(),
  email: draft.email.trim(),
  responsavelId: Number(draft.responsavelId),
  etapaId: draft.etapaId ? Number(draft.etapaId) : null,
  dataReuniao: draft.dataReuniao || null,
  origemNegocio: draft.origemNegocio.trim(),
  estrategiaComercial: draft.estrategiaComercial.trim(),
  servicoInteresse: draft.servicoInteresse.trim(),
  valorEstimadoProposta: draft.valorEstimadoProposta ? Number(draft.valorEstimadoProposta) : null,
  observacoes: draft.observacoes.trim() || null,
});

export const isPipelineNegocioDraftValid = (draft: PipelineNegocioDraft) => Boolean(
  draft.nomeEmpresa.trim()
  && draft.nomeContato.trim()
  && draft.telefone.trim()
  && draft.email.trim()
  && draft.responsavelId
  && draft.origemNegocio.trim()
  && draft.estrategiaComercial.trim()
  && draft.servicoInteresse.trim(),
);
