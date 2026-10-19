import { CampoCadastral } from "./CampoCadastral";
import { completarDadosCadastrais, objetoCadastral, situacaoEmpresa, TIPOS_EMPRESA, type DadosCadastrais, type ValorCadastral } from "@/services/empresaDadosCadastrais";

export const EmpresaSituacaoAlerta = ({ dados }: { dados?: DadosCadastrais }) => {
  const status = situacaoEmpresa(dados);
  if (!status.inativa) return null;
  return <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"><strong>Atenção: empresa {status.texto.toLowerCase()} na Receita Federal.</strong><p className="mt-1 text-xs">Confira a situação cadastral antes de concluir o cadastro.</p></div>;
};

export const EmpresaDadosCadastrais = ({ dados, tipo, onChange, onTipoChange }: { dados?: DadosCadastrais | null; tipo?: string; onChange?: (dados: DadosCadastrais) => void; onTipoChange?: (tipo: string) => void }) => {
  const data = completarDadosCadastrais(dados);
  const company = objetoCadastral(data.company);
  const address = objetoCadastral(data.address);
  const update = (key: string, value: ValorCadastral) => onChange?.({ ...data, [key]: value });
  const sections: [string, DadosCadastrais][] = [
    ["Identificação e situação cadastral", Object.fromEntries(Object.entries(data).filter(([key]) => !["taxId", "alias", "company", "address", "phones", "emails", "mainActivity", "sideActivities", "registrations", "sintegra", "suframa", "avisosConsulta"].includes(key)))],
    ["Enquadramento e quadro societário", Object.fromEntries(Object.entries(company).filter(([key]) => !["id", "name"].includes(key)))],
    ["Complemento do endereço", Object.fromEntries(Object.entries(address).filter(([key]) => !["street", "number", "district", "city", "state", "zip"].includes(key)))],
    ["Contatos cadastrais", { phones: data.phones, emails: data.emails }],
    ["Atividades econômicas", { mainActivity: data.mainActivity, sideActivities: data.sideActivities }],
    ["Inscrições estaduais", { registrations: data.registrations, sintegra: data.sintegra }],
    ["Inscrição e incentivos SUFRAMA", { suframa: data.suframa }],
  ];
  return <section className="space-y-4 rounded-xl border border-border/25 bg-card/40 p-5">
    <h2 className="text-sm font-semibold">Dados cadastrais complementares</h2>
    {!onChange && <EmpresaSituacaoAlerta dados={data} />}
    <div className="space-y-1.5"><label htmlFor="empresa-tipo" className="block text-xs text-muted-foreground">Tipo / enquadramento da empresa</label>
      {onTipoChange ? <select id="empresa-tipo" value={tipo || "NAO_INFORMADO"} onChange={e => onTipoChange(e.target.value)} className="min-h-9 w-full rounded-lg border border-border/30 bg-background/50 px-3 text-sm">{Object.entries(TIPOS_EMPRESA).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select> : <p className="text-sm">{TIPOS_EMPRESA[tipo || "NAO_INFORMADO"] || tipo}</p>}
      <p className="text-xs text-muted-foreground">MEI e Simples Nacional são identificados pela consulta. Os demais regimes podem ser informados quando conhecidos.</p>
    </div>
    {Array.isArray(data.avisosConsulta) && data.avisosConsulta.length > 0 && <div role="status" className="space-y-1 rounded-lg border border-border/30 p-3 text-xs text-muted-foreground">{data.avisosConsulta.map((item, i) => <p key={i}>{String(item)}</p>)}</div>}
    {sections.map(([title, fields], index) => <details key={title} open={index === 0} className="rounded-lg border border-border/25 p-3">
      <summary className="cursor-pointer text-xs font-semibold">{title}</summary>
      <div className="mt-4 space-y-3">{Object.entries(fields).map(([key, value]) => <CampoCadastral key={key} name={key} value={value ?? null} onChange={onChange ? next => {
        if (index === 1) update("company", { ...company, [key]: next });
        else if (index === 2) update("address", { ...address, [key]: next });
        else update(key, next);
      } : undefined} />)}</div>
    </details>)}
  </section>;
};
