import { useState, type FormEvent } from "react";
import { Loader2, Save, X } from "lucide-react";
import { type CadastroIntegracao, type EmpresaIntegracao, type Integracao, type ModuloIntegracao, type OperacaoIntegracao, metodosIntegracao, modulosIntegracao } from "@/services/useIntegracoes";

interface Props {
  integracao?: Integracao; catalogo: OperacaoIntegracao[]; empresas: EmpresaIntegracao[]; erroEmpresas?: boolean;
  salvando: boolean; onSalvar: (dados: CadastroIntegracao) => void; onCancelar: () => void;
}
const campo = "h-10 w-full rounded-lg border border-border/40 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40";
const localDateTime = (value: string) => {
  const date = new Date(value); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16);
};
const alternar = <T,>(lista: T[], valor: T) => lista.includes(valor) ? lista.filter(item => item !== valor) : [...lista, valor];

export function IntegracaoForm({ integracao, catalogo, empresas, erroEmpresas = false, salvando, onSalvar, onCancelar }: Props) {
  const [dados, setDados] = useState<CadastroIntegracao>(() => integracao ? { ...integracao } : {
    nome: "", cnpj: "", responsavel: "", email: "", modulo: "TECNICO", metodos: ["GET"], operacoes: [], empresaIds: [],
    expiraEm: new Date(Date.now() + 90 * 86400000).toISOString(), limitePorMinuto: 120,
  });
  const [buscaEmpresa, setBuscaEmpresa] = useState("");
  const [erro, setErro] = useState("");
  const temGet = dados.metodos.includes("GET");
  const visiveis = catalogo.filter(o => o.modulo === dados.modulo && dados.metodos.includes(o.metodo));
  const empresasVisiveis = empresas.filter(e => `${e.nome} ${e.cnpj}`.toLowerCase().includes(buscaEmpresa.toLowerCase()));
  const atualizar = <K extends keyof CadastroIntegracao>(chave: K, valor: CadastroIntegracao[K]) => setDados(atual => ({ ...atual, [chave]: valor }));
  const metodo = (valor: string) => {
    setErro("");
    const metodos = alternar(dados.metodos, valor);
    setDados(atual => ({ ...atual, metodos, operacoes: atual.operacoes.filter(codigo => catalogo.some(o => o.codigo === codigo && metodos.includes(o.metodo))) }));
  };
  const salvar = (event: FormEvent) => {
    event.preventDefault(); setErro("");
    if (temGet && !dados.empresaIds.length) { setErro("Selecione ao menos uma empresa autorizada para GET."); return; }
    if (!dados.metodos.length || !dados.operacoes.length) { setErro("Selecione os métodos e as operações autorizadas."); return; }
    if (dados.metodos.some(m => !visiveis.some(o => o.metodo === m && dados.operacoes.includes(o.codigo)))) {
      setErro("Selecione ao menos uma operação para cada método marcado."); return;
    }
    onSalvar({ ...dados, nome: dados.nome.trim(), responsavel: dados.responsavel.trim(), email: dados.email.trim(),
      cnpj: dados.cnpj.toUpperCase().replace(/[^A-Z0-9]/g, ""), empresaIds: temGet ? dados.empresaIds : [], expiraEm: new Date(dados.expiraEm).toISOString() });
  };
  return <form onSubmit={salvar} className="rounded-2xl border border-border/40 bg-card/50 p-5" aria-label={integracao ? "Editar integração" : "Nova integração"}>
    <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{integracao ? "Editar integração" : "Nova integração"}</h2>
      <button type="button" onClick={onCancelar} aria-label="Fechar cadastro" className="rounded-lg p-2 hover:bg-muted"><X size={18} /></button></div>
    <fieldset disabled={salvando} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-xs">Empresa ou plataforma *<input className={campo} required maxLength={180} value={dados.nome} onChange={e => atualizar("nome", e.target.value)} /></label>
        <label className="space-y-1 text-xs">CNPJ *<input className={campo} required maxLength={18} minLength={14} pattern="[A-Za-z0-9./-]{14,18}" value={dados.cnpj} onChange={e => atualizar("cnpj", e.target.value)} placeholder="00.000.000/0001-00" /></label>
        <label className="space-y-1 text-xs">Responsável ou representante *<input className={campo} required maxLength={180} value={dados.responsavel} onChange={e => atualizar("responsavel", e.target.value)} /></label>
        <label className="space-y-1 text-xs">E-mail de entrega *<input className={campo} type="email" required maxLength={254} value={dados.email} onChange={e => atualizar("email", e.target.value)} /></label>
        <label className="space-y-1 text-xs">Módulo *<select className={campo} value={dados.modulo} onChange={e => setDados(atual => ({ ...atual, modulo: e.target.value as ModuloIntegracao, metodos: ["GET"], operacoes: [] }))}>
          {Object.entries(modulosIntegracao).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="space-y-1 text-xs">Validade do acesso *<input className={campo} required type="datetime-local" min={localDateTime(new Date(Date.now() + 60000).toISOString())} value={localDateTime(dados.expiraEm)} onChange={e => e.target.value && atualizar("expiraEm", new Date(e.target.value).toISOString())} /></label>
        <label className="space-y-1 text-xs">Limite de requisições por minuto *<input className={campo} type="number" min={1} max={3000} required value={dados.limitePorMinuto} onChange={e => atualizar("limitePorMinuto", Number(e.target.value))} /></label>
      </div>
      <fieldset><legend className="mb-2 text-sm font-medium">Métodos autorizados *</legend><div className="flex flex-wrap gap-3">
        {metodosIntegracao.map(m => <label key={m} className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-xs"><input type="checkbox" checked={dados.metodos.includes(m)} onChange={() => metodo(m)} />{m}</label>)}
      </div></fieldset>
      {temGet && <fieldset><legend className="mb-2 text-sm font-medium">Empresas cujos dados poderão ser consultados por GET * ({dados.empresaIds.length})</legend>
        <input aria-label="Buscar empresa autorizada" className={campo} placeholder="Buscar por nome ou CNPJ" value={buscaEmpresa} onChange={e => setBuscaEmpresa(e.target.value)} />
        <div className="mt-2 max-h-44 space-y-1 overflow-auto rounded-lg border border-border/30 p-2">
          {empresasVisiveis.map(e => <label key={e.id} className="flex cursor-pointer items-center gap-3 rounded p-2 text-sm hover:bg-muted/50"><input type="checkbox" checked={dados.empresaIds.includes(e.id)} onChange={() => atualizar("empresaIds", alternar(dados.empresaIds, e.id))} /><span>{e.nome}<small className="ml-2 text-muted-foreground">{e.cnpj} · #{e.id}</small></span></label>)}
          {!empresasVisiveis.length && <p className="p-2 text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>}
        </div>{erroEmpresas && <p role="alert" className="mt-2 text-xs text-destructive">Não foi possível carregar as empresas. Atualize a página para tentar novamente.</p>}
        <p className="mt-2 text-xs text-muted-foreground">Esta seleção limita as consultas GET. Para POST, PUT, DELETE e PATCH, a empresa é definida na requisição ou pelo registro alterado.</p>
      </fieldset>}
      <fieldset><legend className="mb-2 text-sm font-medium">Operações autorizadas * ({dados.operacoes.length})</legend>
        <p className="mb-3 text-xs text-muted-foreground">Marque as operações que a plataforma precisa usar. Aprovação, exclusão e movimentação têm autorizações próprias.</p>
        <button type="button" className="mb-2 text-xs text-primary underline" onClick={() => atualizar("operacoes", dados.operacoes.length === visiveis.length ? [] : visiveis.map(o => o.codigo))}>
          {dados.operacoes.length === visiveis.length && visiveis.length ? "Limpar seleção" : "Selecionar operações exibidas"}</button>
        <div className="max-h-80 space-y-2 overflow-auto">{visiveis.map(o => <div key={o.codigo} className="rounded-lg border border-border/30 p-3">
          <label className="flex cursor-pointer items-start gap-3"><input className="mt-1" type="checkbox" checked={dados.operacoes.includes(o.codigo)} onChange={() => atualizar("operacoes", alternar(dados.operacoes, o.codigo))} /><span className="min-w-0"><span className="break-all font-mono text-xs"><b className={o.metodo === "DELETE" ? "text-destructive" : "text-primary"}>{o.metodo}</b> {o.caminho}</span><span className="mt-1 block text-xs text-muted-foreground">{o.descricao}</span></span></label>
          {o.payloadExemplo && <details className="ml-6 mt-2 text-xs"><summary className="cursor-pointer text-muted-foreground">Payload de exemplo</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap rounded bg-muted/40 p-2">{JSON.stringify(JSON.parse(o.payloadExemplo), null, 2)}</pre></details>}
        </div>)}{!visiveis.length && <p className="text-sm text-muted-foreground">Selecione um método para visualizar as operações.</p>}</div>
      </fieldset>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <p className="text-xs text-muted-foreground">{integracao ? "Ao salvar, os tokens em uso serão invalidados e a documentação será reenviada. A troca do e-mail exige nova ativação." : "Ao criar, o responsável receberá o Client ID, um link de ativação válido por até 24 horas e a documentação PDF das operações selecionadas."}</p>
      <div className="flex justify-end gap-2"><button type="button" onClick={onCancelar} className="rounded-lg border border-border px-4 py-2 text-sm">Cancelar</button>
        <button disabled={salvando || (temGet && !empresas.length) || !catalogo.length} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{salvando ? "Salvando…" : integracao ? "Salvar alterações" : "Criar integração"}</button></div>
    </fieldset>
  </form>;
}
