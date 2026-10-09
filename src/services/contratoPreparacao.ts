import type { Contrato, ContratoPreparacaoEtapa } from "./useContratos";
import { getProposalServicesLabel } from "./proposalPayments";

export const CONTRATO_PREPARACAO_COLUNAS: { id: ContratoPreparacaoEtapa; nome: string }[] = [
  { id: "A_FAZER", nome: "À fazer" }, { id: "EM_ANDAMENTO", nome: "Em andamento" },
  { id: "REVISAO", nome: "Revisão" }, { id: "CONCLUIDO", nome: "Concluído" },
];

export function getContratoPreparacaoEtapa(contrato: Contrato): ContratoPreparacaoEtapa {
  if (contrato.status === "APROVADO") return "CONCLUIDO";
  return contrato.etapaPreparacao || (contrato.urlPdf ? "EM_ANDAMENTO" : "A_FAZER");
}

export function getContratoPreparacaoTitulo(contrato: Contrato) {
  return `Criação de Contrato - ${contrato.empresaNome} - ${getProposalServicesLabel(contrato)}`;
}
