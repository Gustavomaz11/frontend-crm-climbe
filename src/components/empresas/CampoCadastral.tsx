import { useId } from "react";
import { modeloColecao, type DadosCadastrais, type ValorCadastral } from "@/services/empresaDadosCadastrais";

const labels: Record<string, string> = {
  updated: "Última atualização", founded: "Data de abertura", head: "Matriz", statusDate: "Data da situação cadastral", status: "Situação cadastral", reason: "Motivo da situação", special: "Situação especial", specialDate: "Data da situação especial",
  company: "Empresa", equity: "Capital social (R$)", nature: "Natureza jurídica", size: "Porte", jurisdiction: "Ente federativo responsável", simples: "Simples Nacional", simei: "MEI / SIMEI", optant: "Optante", since: "Data de inclusão", members: "Sócios e administradores",
  person: "Sócio / administrador", name: "Nome", taxId: "CPF / CNPJ", type: "Tipo", age: "Faixa etária", country: "País", role: "Qualificação", agent: "Representante", legalRepresentative: "Representante legal", ownership: "Titularidade", area: "DDD", number: "Número", phones: "Telefones", emails: "E-mails", address: "Endereço", street: "Logradouro", district: "Bairro", city: "Cidade", state: "UF", zip: "CEP", details: "Complemento", municipality: "Código IBGE do município",
  mainActivity: "CNAE principal", sideActivities: "CNAEs secundários", id: "Código", text: "Descrição", acronym: "Sigla", domain: "Domínio", registrations: "Cadastro de Contribuintes", sintegra: "SINTEGRA", enabled: "Habilitada como contribuinte", suframa: "SUFRAMA", approved: "Projeto aprovado", approvalDate: "Data de aprovação", incentives: "Incentivos fiscais", benefit: "Benefício", tax: "Tributo", value: "Valor", expiration: "Validade", end: "Término", start: "Início", date: "Data", alias: "Nome fantasia", nameOrigin: "Nome na origem", statusReason: "Motivo da situação", legalNature: "Natureza jurídica", statusText: "Situação", avisosConsulta: "Observações das consultas",
};
const inputClass = "min-h-9 w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-xs text-foreground outline-none focus:border-accent/50";

export const CampoCadastral = ({ name, value, onChange, label }: { name: string; value: ValorCadastral; onChange?: (value: ValorCadastral) => void; label?: string }) => {
  const id = useId();
  const title = label || (name === "number" ? "Número do registro" : labels[name]) || name.replace(/([a-z])([A-Z])/g, "$1 $2");
  if (Array.isArray(value)) return <fieldset className="min-w-0 space-y-3 rounded-lg border border-border/20 p-3">
    <legend className="px-1 text-xs font-medium">{title} ({value.length})</legend>
    {value.map((item, index) => <div key={index} className="space-y-2">
      <CampoCadastral name={name} label={`${title} ${index + 1}`} value={item} onChange={onChange ? next => onChange(value.map((old, i) => i === index ? next : old)) : undefined} />
      {onChange && <button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))} className="text-xs text-destructive">Remover {title.toLowerCase()} {index + 1}</button>}
    </div>)}
    {!value.length && <p className="text-xs text-muted-foreground">Nenhum registro informado.</p>}
    {onChange && <button type="button" className="rounded border border-border/40 px-3 py-2 text-xs text-accent" onClick={() => onChange([...value, modeloColecao(name)])}>Adicionar {title.toLowerCase()}</button>}
  </fieldset>;
  if (value && typeof value === "object") return <fieldset className="min-w-0 space-y-3 rounded-lg border border-border/20 p-3">
    <legend className="px-1 text-xs font-medium">{title}</legend>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{Object.entries(value).filter(([key, item]) => !/history|historico|certificate|^links$/i.test(key) && !(key === "id" && typeof item === "string" && item.includes("-"))).map(([key, item]) => <CampoCadastral key={key} name={key} value={item} onChange={onChange ? next => onChange({ ...value, [key]: next } as DadosCadastrais) : undefined} />)}</div>
  </fieldset>;
  if (!onChange) return <div className="min-w-0"><p className="text-[10px] text-muted-foreground">{title}</p><p className="mt-1 break-words text-xs">{value == null || value === "" ? "Não informado" : typeof value === "boolean" ? value ? "Sim" : "Não" : String(value)}</p></div>;
  const boolean = typeof value === "boolean" || ["head", "optant", "enabled", "approved"].includes(name);
  const enumOptions: Record<string, string> | undefined = typeof value !== "string" ? undefined : ["NATURAL", "LEGAL", "FOREIGN"].includes(value) ? { NATURAL: "Pessoa física", LEGAL: "Pessoa jurídica", FOREIGN: "Estrangeiro" } : ["MOBILE", "LANDLINE"].includes(value) ? { MOBILE: "Celular", LANDLINE: "Telefone fixo" } : ["CORPORATE", "PERSONAL"].includes(value) ? { CORPORATE: "Corporativo", PERSONAL: "Pessoal" } : undefined;
  return <div className="min-w-0 space-y-1.5"><label htmlFor={id} className="block text-[11px] text-muted-foreground">{title}</label>
    {boolean ? <select id={id} value={value == null ? "" : String(value)} onChange={e => onChange(e.target.value === "" ? null : e.target.value === "true")} className={inputClass}><option value="">Não informado</option><option value="true">Sim</option><option value="false">Não</option></select>
      : enumOptions ? <select id={id} value={String(value)} onChange={e => onChange(e.target.value)} className={inputClass}>{Object.entries(enumOptions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      : <input id={id} type={typeof value === "number" || name === "equity" ? "number" : /Date$|^founded$|^since$/.test(name) ? "date" : "text"} step="any" value={value == null ? "" : String(value)} onChange={e => onChange(typeof value === "number" || name === "equity" ? e.target.value === "" ? null : Number(e.target.value) : e.target.value)} className={inputClass} />}
  </div>;
};
