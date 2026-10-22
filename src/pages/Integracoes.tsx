import { useRef, useState } from "react";
import { Download, History, KeyRound, Loader2, Mail, Pencil, Plus, RotateCcw } from "lucide-react";
import { AppPageShell } from "@/components/layout/AppPageShell";
import { IntegracaoForm } from "@/components/integracoes/IntegracaoForm";
import { IntegracaoAuditoriaPanel } from "@/components/integracoes/IntegracaoAuditoriaPanel";
import { useAuthStore } from "@/store/useAuthStore";
import { useUsuarioPermissoes } from "@/services/usePermissoes";
import { type CadastroIntegracao, type Integracao, baixarDocumentacaoIntegracao, erroIntegracao, modulosIntegracao, useAcaoIntegracao, useCatalogoIntegracoes, useEmpresasIntegracoes, useIntegracoes, useSalvarIntegracao } from "@/services/useIntegracoes";

const statusNome: Record<string, string> = { ATIVO: "Ativo", PENDENTE: "Aguardando ativação", SUSPENSO: "Suspenso", REVOGADO: "Revogado" };
const data = (valor?: string | null) => valor ? new Date(valor).toLocaleString("pt-BR") : "Ainda não utilizado";
export default function Integracoes() {
  const usuarioId = useAuthStore(s => s.basicUserData?.id ?? s.userData?.id);
  const permissoes = useUsuarioPermissoes(usuarioId);
  const autorizado = permissoes.data?.some(p => p.permissao.codigo === "INTEGRACOES_GERENCIAR") ?? false;
  const lista = useIntegracoes(autorizado);
  const catalogo = useCatalogoIntegracoes(autorizado);
  const empresas = useEmpresasIntegracoes(autorizado);
  const salvar = useSalvarIntegracao(); const acao = useAcaoIntegracao();
  const [form, setForm] = useState<Integracao | "novo" | null>(null);
  const [historico, setHistorico] = useState<Integracao | null>(null);
  const [busca, setBusca] = useState(""); const [feedback, setFeedback] = useState<{ erro: boolean; texto: string } | null>(null);
  const [baixando, setBaixando] = useState<string | null>(null);
  const topo = useRef<HTMLDivElement>(null);
  const abrir = (item: Integracao | "novo") => { setForm(item); setHistorico(null); setFeedback(null); topo.current?.scrollIntoView({ behavior: "smooth" }); };
  const gravar = async (dados: CadastroIntegracao) => {
    try {
      await salvar.mutateAsync({ id: form && form !== "novo" ? form.id : undefined, dados }); setForm(null);
      setFeedback({ erro: false, texto: "Integração salva. O e-mail com a documentação está na fila de envio." });
    } catch (e) { setFeedback({ erro: true, texto: erroIntegracao(e) }); }
  };
  const executar = async (item: Integracao, tipo: "status" | "rotacionar" | "reenviar", status?: string) => {
    const confirmacao = tipo === "rotacionar" ? "Gerar novas credenciais? O segredo e os tokens atuais serão invalidados. Um novo link será enviado por e-mail."
      : status === "REVOGADO" ? "Revogar permanentemente esta integração e invalidar todos os seus acessos?"
      : status === "SUSPENSO" ? "Suspender esta integração e invalidar os tokens em uso?" : null;
    if (confirmacao && !window.confirm(confirmacao)) return;
    try {
      await acao.mutateAsync({ id: item.id, acao: tipo, status });
      setFeedback({ erro: false, texto: tipo === "reenviar" ? "E-mail adicionado à fila de envio." : tipo === "rotacionar" ? "Credenciais invalidadas. Um novo link de ativação será enviado." : "Status atualizado." });
    } catch (e) { setFeedback({ erro: true, texto: erroIntegracao(e) }); }
  };
  const download = async (id: string) => {
    setBaixando(id); try { await baixarDocumentacaoIntegracao(id); }
    catch (e) { setFeedback({ erro: true, texto: erroIntegracao(e) }); } finally { setBaixando(null); }
  };
  const itens = (lista.data ?? []).filter(i => `${i.nome} ${i.cnpj} ${i.clientId} ${i.responsavel}`.toLowerCase().includes(busca.toLowerCase()));
  const botao = "inline-flex items-center gap-1.5 rounded-lg border border-border/40 px-3 py-2 text-xs hover:bg-muted/50 disabled:opacity-50";
  return <AppPageShell><div ref={topo} className="mx-auto max-w-6xl space-y-5 px-4 py-7 md:px-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><KeyRound className="text-primary" />Tokens e Integração</h1><p className="mt-1 text-sm text-muted-foreground">Gerencie credenciais e permissões de plataformas externas.</p></div>
      {autorizado && <button onClick={() => abrir("novo")} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"><Plus size={16} />Nova integração</button>}</div>
    {permissoes.isLoading ? <p>Verificando permissões…</p> : permissoes.error ? <p role="alert" className="text-destructive">Não foi possível verificar suas permissões.</p> : !autorizado ? <p className="rounded-xl border border-border p-5 text-sm">Você não tem permissão para gerenciar integrações.</p> : <>
      {feedback && <div role={feedback.erro ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${feedback.erro ? "border-destructive/30 text-destructive" : "border-primary/30 text-primary"}`}>{feedback.texto}</div>}
      {catalogo.error && <p role="alert" className="text-sm text-destructive">Não foi possível carregar o catálogo. Atualize a página para tentar novamente.</p>}
      {form && <IntegracaoForm key={form === "novo" ? "novo" : form.id} integracao={form === "novo" ? undefined : form} catalogo={catalogo.data ?? []} empresas={empresas.data ?? []} erroEmpresas={!!empresas.error} salvando={salvar.isPending} onSalvar={gravar} onCancelar={() => setForm(null)} />}
      {historico && <IntegracaoAuditoriaPanel key={historico.id} id={historico.id} nome={historico.nome} onFechar={() => setHistorico(null)} />}
      <input aria-label="Buscar integração" placeholder="Buscar por empresa, CNPJ, responsável ou Client ID" className="h-11 w-full rounded-xl border border-border/40 bg-card/50 px-4 text-sm" value={busca} onChange={e => setBusca(e.target.value)} />
      {lista.isLoading && <p className="flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={16} />Carregando integrações…</p>}
      {lista.error && <p role="alert" className="text-sm text-destructive">{erroIntegracao(lista.error)}</p>}
      {!lista.isLoading && !lista.error && !itens.length && <div className="rounded-2xl border border-dashed border-border p-10 text-center"><KeyRound className="mx-auto mb-3 text-muted-foreground" /><h2 className="font-semibold">{busca ? "Nenhuma integração encontrada" : "Nenhuma integração cadastrada"}</h2><p className="mt-2 text-sm text-muted-foreground">Crie credenciais para conectar uma plataforma aos módulos do Climbe.</p></div>}
      <div className="space-y-4">{itens.map(i => {
        const expirada = new Date(i.expiraEm).getTime() <= Date.now();
        return <article key={i.id} className="rounded-2xl border border-border/40 bg-card/50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{i.nome}</h2><p className="mt-1 text-xs text-muted-foreground">{i.cnpj} · {i.responsavel} · {i.email}</p></div><span className={`rounded-full px-3 py-1 text-xs ${!expirada && i.status === "ATIVO" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{i.status === "REVOGADO" ? "Revogado" : expirada ? "Expirado" : statusNome[i.status]}</span></div>
          <p className="mt-3 break-all font-mono text-xs text-muted-foreground">{i.clientId}</p>
          <div className="my-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4"><p><b className="text-foreground">{modulosIntegracao[i.modulo]}</b> · {i.metodos.join(", ")}</p><p>{i.operacoes.length} operações · {i.metodos.includes("GET") ? `${i.empresaIds.length} empresas para GET` : "empresa definida na operação"}</p><p>Validade: {data(i.expiraEm)}</p><p>Limite: {i.limitePorMinuto}/min</p><p className="sm:col-span-2">Último uso: {data(i.ultimoUso)}</p><p className={i.emailStatus === "FALHOU" ? "text-destructive sm:col-span-2" : "sm:col-span-2"}>E-mail: {i.emailStatus === "ENVIADO" ? "enviado" : i.emailStatus === "FALHOU" ? `falha no envio (${i.emailTentativas} tentativas)` : "aguardando envio"}</p></div>
          <div className="flex flex-wrap gap-2">
            {i.status !== "REVOGADO" && <button className={botao} onClick={() => abrir(i)}><Pencil size={14} />Editar</button>}
            <button className={botao} disabled={baixando !== null} onClick={() => download(i.id)}>{baixando === i.id ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}Documentação PDF</button>
            <button className={botao} onClick={() => { setHistorico(i); setForm(null); topo.current?.scrollIntoView({ behavior: "smooth" }); }}><History size={14} />Histórico</button>
            {i.status !== "REVOGADO" && <><button disabled={acao.isPending} className={botao} onClick={() => executar(i, "reenviar")}><Mail size={14} />Reenviar e-mail</button>
              {!expirada && <button disabled={acao.isPending} className={botao} onClick={() => executar(i, "rotacionar")}><RotateCcw size={14} />Rotacionar segredo</button>}
              {i.status === "ATIVO" && <button disabled={acao.isPending} className={botao} onClick={() => executar(i, "status", "SUSPENSO")}>Suspender</button>}
              {i.status === "SUSPENSO" && !expirada && <button disabled={acao.isPending} className={botao} onClick={() => executar(i, "status", "ATIVO")}>Reativar</button>}
              <button disabled={acao.isPending} className={`${botao} text-destructive`} onClick={() => executar(i, "status", "REVOGADO")}>Revogar</button></>}
          </div></article>;
      })}</div>
    </>}
  </div></AppPageShell>;
}
