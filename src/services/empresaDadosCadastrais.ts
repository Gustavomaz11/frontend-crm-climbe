export type ValorCadastral = string | number | boolean | null | ValorCadastral[] | DadosCadastrais;
export interface DadosCadastrais { [key: string]: ValorCadastral }

export const TIPOS_EMPRESA: Record<string, string> = {
  NAO_INFORMADO: "Não informado", MEI: "MEI", SIMPLES_NACIONAL: "Simples Nacional",
  NAO_OPTANTE: "Não optante pelo Simples Nacional", LUCRO_PRESUMIDO: "Lucro Presumido",
  LUCRO_REAL: "Lucro Real", IMUNE: "Imune", ISENTA: "Isenta",
};

export const objetoCadastral = (value: ValorCadastral | undefined): DadosCadastrais => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const comContatosPrincipais = (dados: DadosCadastrais, telefone: string, email: string): DadosCadastrais => {
  const next = { ...dados };
  const digits = telefone.replace(/\D/g, "");
  if (digits.length >= 10) {
    const phones = Array.isArray(dados.phones) ? [...dados.phones] : [];
    phones[0] = { ...objetoCadastral(phones[0]), area: digits.slice(0, 2), number: digits.slice(2) }; next.phones = phones;
  }
  if (email) {
    const emails = Array.isArray(dados.emails) ? [...dados.emails] : [];
    emails[0] = { ...objetoCadastral(emails[0]), address: email }; next.emails = emails;
  }
  return next;
};

export const situacaoEmpresa = (dados?: DadosCadastrais) => {
  const status = objetoCadastral(dados?.status);
  return { texto: String(status.text || "Não informada"), inativa: status.id != null && status.id !== "" && Number(status.id) !== 2 };
};

export const semHistoricos = (data: DadosCadastrais): DadosCadastrais => Object.fromEntries(Object.entries(data)
  .filter(([key]) => !/history|historico|certificate|^links$/i.test(key))
  .map(([key, value]) => [key, Array.isArray(value) ? value.map(item => typeof item === "object" && item !== null && !Array.isArray(item) ? semHistoricos(item) : item) : typeof value === "object" && value !== null ? semHistoricos(value) : value]));

export const dadosCadastraisVazios = (): DadosCadastrais => ({
  founded: "", head: null, statusDate: "", status: { id: null, text: "" }, reason: { id: null, text: "" }, specialDate: "", special: { id: null, text: "" },
  company: { equity: null, nature: { id: null, text: "" }, size: { id: null, acronym: "", text: "" }, jurisdiction: "", simples: { optant: null, since: "" }, simei: { optant: null, since: "" }, members: [] },
  address: { details: "", municipality: null, country: { id: 76, name: "Brasil" } },
  phones: [], emails: [], mainActivity: { id: null, text: "" }, sideActivities: [], registrations: [], sintegra: [],
  suframa: { number: "", since: "", approved: null, approvalDate: "", status: { id: null, text: "" }, incentives: [] },
});

export const completarDadosCadastrais = (data: DadosCadastrais | null = {}): DadosCadastrais => {
  const merge = (base: DadosCadastrais, atual: DadosCadastrais): DadosCadastrais => Object.fromEntries(Object.entries({ ...base, ...atual }).map(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) return [key, merge(objetoCadastral(base[key]), value)];
    return [key, value];
  }));
  return merge(dadosCadastraisVazios(), semHistoricos(data ?? {}));
};

export const modeloColecao = (key: string): DadosCadastrais => {
  if (key === "members") return { since: "", person: { name: "", taxId: "", type: "NATURAL", age: "", country: { id: 76, name: "Brasil" } }, role: { id: null, text: "" } };
  if (key === "phones") return { type: "MOBILE", area: "", number: "" };
  if (key === "emails") return { ownership: "CORPORATE", address: "", domain: "" };
  if (key === "registrations" || key === "sintegra") return { number: "", state: "", enabled: null, statusDate: "", status: { id: null, text: "" }, type: { id: null, text: "" } };
  return { id: null, text: "" };
};
