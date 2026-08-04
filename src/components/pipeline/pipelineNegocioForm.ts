import type { PipelineNegocio, PipelineNegocioInput } from "@/services/usePipelineVendas";
import type { Empresa } from "@/services/useEmpresas";
import { isValidCnpj } from "@/lib/cnpj";
import {
  estrategiaComercialOptions,
  normalizePipelineNegocioOption,
  origemNegocioOptions,
  servicoInteresseOptions,
} from "./pipelineNegocioOptions";

export interface PipelineNegocioDraft {
  empresaId: string;
  cadastrarEmpresa: boolean;
  cnpj: string;
  nomeEmpresa: string;
  nomeContato: string;
  telefone: string;
  email: string;
  responsavelId: string;
  etapaId: string;
  dataReuniao: string;
  origemNegocio: string;
  estrategiaComercial: string;
  servicosInteresse: string[];
  valorEstimadoProposta: string;
  observacoes: string;
}

export const emptyPipelineNegocioDraft: PipelineNegocioDraft = {
  empresaId: "",
  cadastrarEmpresa: true,
  cnpj: "",
  nomeEmpresa: "",
  nomeContato: "",
  telefone: "",
  email: "",
  responsavelId: "",
  etapaId: "",
  dataReuniao: "",
  origemNegocio: "",
  estrategiaComercial: "",
  servicosInteresse: [],
  valorEstimadoProposta: "",
  observacoes: "",
};

export const empresaToNegocioContactFields = (
  empresa: Empresa,
): Pick<PipelineNegocioDraft, "nomeEmpresa" | "nomeContato" | "telefone" | "email" | "cnpj"> => {
  const contatoRepresentante = empresa.representanteContato.trim();
  const contatoRepresentanteEhEmail = contatoRepresentante.includes("@");

  return {
    nomeEmpresa: empresa.nome.trim(),
    nomeContato: empresa.representanteNome.trim(),
    telefone: empresa.telefone.trim()
      || (!contatoRepresentanteEhEmail ? contatoRepresentante : ""),
    email: empresa.email.trim()
      || (contatoRepresentanteEhEmail ? contatoRepresentante : ""),
    cnpj: empresa.cnpj.trim(),
  };
};

const negocioServicosToDraft = (negocio: PipelineNegocio) => {
  const values = negocio.servicosInteresse?.length
    ? negocio.servicosInteresse
    : negocio.servicoInteresse.split(",");
  return [...new Set(values
    .map((value) => normalizePipelineNegocioOption(value, servicoInteresseOptions))
    .filter(Boolean))];
};

export const negocioToDraft = (negocio: PipelineNegocio): PipelineNegocioDraft => ({
  empresaId: negocio.empresaId ? String(negocio.empresaId) : "",
  cadastrarEmpresa: false,
  cnpj: "",
  nomeEmpresa: negocio.nomeEmpresa,
  nomeContato: negocio.nomeContato,
  telefone: negocio.telefone,
  email: negocio.email,
  responsavelId: String(negocio.responsavelId),
  etapaId: String(negocio.etapaId),
  dataReuniao: negocio.dataReuniao?.slice(0, 16) || "",
  origemNegocio: normalizePipelineNegocioOption(negocio.origemNegocio, origemNegocioOptions),
  estrategiaComercial: normalizePipelineNegocioOption(negocio.estrategiaComercial, estrategiaComercialOptions),
  servicosInteresse: negocioServicosToDraft(negocio),
  valorEstimadoProposta: negocio.valorEstimadoProposta ? String(negocio.valorEstimadoProposta) : "",
  observacoes: negocio.observacoes || "",
});

export const draftToNegocioInput = (draft: PipelineNegocioDraft): PipelineNegocioInput => ({
  empresaId: draft.empresaId ? Number(draft.empresaId) : null,
  cadastrarEmpresa: !draft.empresaId && draft.cadastrarEmpresa,
  cnpj: !draft.empresaId && draft.cadastrarEmpresa ? draft.cnpj.trim() : null,
  nomeEmpresa: draft.nomeEmpresa.trim(),
  nomeContato: draft.nomeContato.trim(),
  telefone: draft.telefone.trim(),
  email: draft.email.trim(),
  responsavelId: Number(draft.responsavelId),
  etapaId: draft.etapaId ? Number(draft.etapaId) : null,
  dataReuniao: draft.dataReuniao || null,
  origemNegocio: draft.origemNegocio.trim(),
  estrategiaComercial: draft.estrategiaComercial.trim(),
  servicoInteresse: draft.servicosInteresse.join(", "),
  servicosInteresse: draft.servicosInteresse,
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
  && (!draft.cadastrarEmpresa || Boolean(draft.empresaId) || isValidCnpj(draft.cnpj)),
);
