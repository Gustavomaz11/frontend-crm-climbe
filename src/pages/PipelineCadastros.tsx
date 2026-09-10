import { useState } from "react";
import { toast } from "sonner";
import { PipelineVendasShell } from "@/components/pipeline/PipelineVendasShell";
import { usePipelineTags, usePipelineCampos, useSalvarCadastro, commercialError, type PipelineCampo } from "@/services/usePipelineCadastros";
import { useUsuarioPermissoes } from "@/services/usePermissoes";
import { useAuthStore } from "@/store/useAuthStore";

const tipos = { TEXTO: "Texto", NUMERO: "Número", DATA: "Data", SELECAO: "Lista de opções", BOOLEANO: "Sim ou não" };
const escopos = { TODOS: "Pré-vendas e vendas", PRE_VENDAS: "Pré-vendas", VENDAS: "Vendas" };
const input = "rounded border border-border/30 bg-background p-2 text-sm";
const PipelineCadastros = () => {
  const { data: tags = [] } = usePipelineTags();
  const { data: campos = [] } = usePipelineCampos();
  const user = useAuthStore(s => s.basicUserData?.id ?? s.userData?.id);
  const { data: permissions = [] } = useUsuarioPermissoes(user);
  const canManage = permissions.some(p => p.permissao.codigo === "COMERCIAL_CADASTROS_GERENCIAR");
  const salvar = useSalvarCadastro();
  const [nomeTag, setNomeTag] = useState("");
  const [cor, setCor] = useState("#3b82f6");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<PipelineCampo["tipo"]>("TEXTO");
  const [escopo, setEscopo] = useState<PipelineCampo["escopo"]>("TODOS");
  const [opcoes, setOpcoes] = useState("");
  const save = async (args: Parameters<typeof salvar.mutateAsync>[0]) => {
    try { await salvar.mutateAsync(args); toast.success("Cadastro salvo"); if (!args.id) { setNome(""); setNomeTag(""); } }
    catch (error) { toast.error(commercialError(error)); }
  };
  return <PipelineVendasShell activePath="/pipeline-vendas/cadastros" search="" onSearchChange={() => {}}><main className="space-y-8 p-6"><h1 className="text-2xl font-semibold">Tags e campos personalizados</h1>
    <section className="space-y-3"><h2 className="font-semibold">Tags</h2>{canManage && <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void save({ tipo: "tags", data: { nome: nomeTag, cor, ativo: true } }); }}><input aria-label="Nome da tag" required maxLength={80} placeholder="Nome da tag" className={input} value={nomeTag} onChange={e => setNomeTag(e.target.value)} /><input aria-label="Cor da tag" type="color" value={cor} onChange={e => setCor(e.target.value)} /><button disabled={salvar.isPending} className="rounded bg-accent px-3 text-accent-foreground">Criar tag</button></form>}
      {tags.map(t => <div key={t.id} className="flex items-center gap-3 rounded border border-border/25 p-3"><span style={{ background: t.cor }} className="h-3 w-3 rounded-full" /><span>{t.nome}</span><span className="text-xs text-muted-foreground">{t.ativo ? "Ativa" : "Inativa"}</span>{canManage && <button disabled={salvar.isPending} className="ml-auto text-xs underline" onClick={() => void save({ tipo: "tags", id: t.id, data: { ...t, ativo: !t.ativo } })}>{t.ativo ? "Inativar" : "Reativar"}</button>}</div>)}
    </section>
    <section className="space-y-3"><h2 className="font-semibold">Campos personalizados</h2>{canManage && <form className="grid max-w-2xl gap-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); void save({ tipo: "campos", data: { nome, tipo, escopo, opcoes: tipo === "SELECAO" ? opcoes : undefined, ativo: true } }); }}><input aria-label="Nome do campo" required maxLength={100} placeholder="Nome do campo" className={input} value={nome} onChange={e => setNome(e.target.value)} /><select aria-label="Tipo do campo" className={input} value={tipo} onChange={e => setTipo(e.target.value as PipelineCampo["tipo"])}>{Object.entries(tipos).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}</select><select aria-label="Disponibilidade do campo" className={input} value={escopo} onChange={e => setEscopo(e.target.value as PipelineCampo["escopo"])}><option value="TODOS">Pré-vendas e vendas</option><option value="PRE_VENDAS">Pré-vendas</option><option value="VENDAS">Vendas</option></select>{tipo === "SELECAO" && <textarea required aria-label="Opções do campo" placeholder="Uma opção por linha" className={input} value={opcoes} onChange={e => setOpcoes(e.target.value)} />}<button disabled={salvar.isPending} className="rounded bg-accent p-2 text-accent-foreground">Criar campo</button></form>}
      {campos.map(c => <div key={c.id} className="flex flex-wrap items-center gap-3 rounded border border-border/25 p-3"><span>{c.nome}</span><span className="text-xs text-muted-foreground">{tipos[c.tipo]} · {escopos[c.escopo]} · {c.ativo ? "Ativo" : "Inativo"}</span>{canManage && <button disabled={salvar.isPending} className="ml-auto text-xs underline" onClick={() => void save({ tipo: "campos", id: c.id, data: { ...c, ativo: !c.ativo } })}>{c.ativo ? "Inativar" : "Reativar"}</button>}</div>)}
    </section>
  </main></PipelineVendasShell>;
};
export default PipelineCadastros;
