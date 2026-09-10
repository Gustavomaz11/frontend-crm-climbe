import type { Dispatch, SetStateAction } from "react";
import { usePessoas } from "@/services/usePessoas";
import { useCampanhasOpcoes, usePipelineCampos, usePipelineTags } from "@/services/usePipelineCadastros";
import type { PipelineNegocioDraft } from "./pipelineNegocioForm";

interface Props { draft: PipelineNegocioDraft; setDraft: Dispatch<SetStateAction<PipelineNegocioDraft>>; preVendas: boolean; campanhaFixa?: boolean; disabled: boolean }
const input = "mt-1 w-full rounded-lg border border-border/30 bg-background p-2 text-sm";
export const PipelineDadosAdicionais = ({ draft, setDraft, preVendas, campanhaFixa, disabled }: Props) => {
  const { data: pessoas = [] } = usePessoas();
  const { data: campanhas = [] } = useCampanhasOpcoes();
  const { data: tags = [] } = usePipelineTags();
  const { data: campos = [] } = usePipelineCampos();
  const update = (patch: Partial<PipelineNegocioDraft>) => setDraft(current => ({ ...current, ...patch }));
  const setValue = (id: number, value: string) => update({ campos: { ...draft.campos, [id]: value } });
  return <fieldset disabled={disabled} className="mt-5 grid gap-4 border-t border-border/30 pt-5 sm:grid-cols-2">
    <label className="text-xs">Pessoa cadastrada<select className={input} value={draft.pessoaId || ""} onChange={e => {
      const pessoa = pessoas.find(p => p.id === Number(e.target.value));
      update({ pessoaId: e.target.value, ...(pessoa ? { nomeContato: pessoa.nome, telefone: pessoa.telefone || "", email: pessoa.email || "" } : {}) });
    }}><option value="">Sem vínculo com Pessoas</option>{pessoas.filter(p => p.empresas.some(e => e.id === Number(draft.empresaId))).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select><span className="text-muted-foreground">Selecione a empresa para consultar seus contatos.</span></label>
    <label className="text-xs">Campanha de origem<select disabled={campanhaFixa} className={input} value={draft.campanhaOrigemId || ""} onChange={e => {
      const campanha = campanhas.find(c => c.id === Number(e.target.value));
      update({ campanhaOrigemId: e.target.value, ...(campanha ? { estrategiaComercial: campanha.estrategia } : {}) });
    }}><option value="">Sem campanha</option>{campanhas.map(c => <option key={c.id} value={c.id}>{c.nome}{c.ativo ? "" : " (inativa)"}</option>)}</select></label>
    <div className="sm:col-span-2"><p className="mb-2 text-xs">Tags</p><div className="flex flex-wrap gap-3">{tags.filter(t => t.ativo || draft.tagIds?.includes(t.id)).map(t => <label key={t.id} className="flex items-center gap-2 rounded border px-2 py-1 text-xs" style={{ borderColor: t.cor }}><input type="checkbox" checked={draft.tagIds?.includes(t.id) || false} onChange={e => update({ tagIds: e.target.checked ? [...(draft.tagIds || []), t.id] : draft.tagIds?.filter(id => id !== t.id) })} /><span className="h-2 w-2 rounded-full" style={{ background: t.cor }} />{t.nome}</label>)}</div></div>
    {campos.filter(c => (c.ativo || draft.campos?.[c.id] !== undefined) && (c.escopo === "TODOS" || c.escopo === (preVendas ? "PRE_VENDAS" : "VENDAS"))).map(c => <label key={c.id} className="text-xs">{c.nome}
      {c.tipo === "SELECAO" || c.tipo === "BOOLEANO" ? <select className={input} value={draft.campos?.[c.id] || ""} onChange={e => setValue(c.id, e.target.value)}><option value="">Não informado</option>{c.tipo === "BOOLEANO" ? <><option value="true">Sim</option><option value="false">Não</option></> : c.opcoes?.split(/\r?\n/).filter(Boolean).map(o => <option key={o}>{o}</option>)}</select>
        : <input className={input} type={c.tipo === "DATA" ? "date" : c.tipo === "NUMERO" ? "number" : "text"} step="any" maxLength={4000} value={draft.campos?.[c.id] || ""} onChange={e => setValue(c.id, e.target.value)} />}
    </label>)}
  </fieldset>;
};
