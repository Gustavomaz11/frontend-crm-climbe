export const estrategiaComercialOptions = ["Ativa", "Receptiva", "Recuperação", "Expansão"] as const;

export const servicoInteresseOptions = [
  "BPO",
  "CFO",
  "Contabilidade",
  "Valuation",
  "Finance Support",
  "Consórcio",
] as const;

export const origemNegocioOptions = [
  "Site",
  "Redes Sociais",
  "Indicação",
  "Outbound",
  "Eventos",
  "Account Planning",
  "Up & Cross Sell",
  "Renovação",
  "Negócios Perdidos",
] as const;

export const normalizePipelineNegocioOption = (
  value: string,
  options: readonly string[],
) => options.find((option) =>
  option.localeCompare(value.trim(), "pt-BR", { sensitivity: "base" }) === 0,
) ?? "";
