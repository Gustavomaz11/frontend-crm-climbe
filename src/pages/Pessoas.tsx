import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { CriarLeadsDialog } from "@/components/pessoas/CriarLeadsDialog";
import { useUsuarioPermissoes } from "@/services/usePermissoes";
import { useAuthStore } from "@/store/useAuthStore";
import { PessoaClienteDialog } from "@/components/pessoas/PessoaClienteDialog";
import { PipelineVendasShell } from "@/components/pipeline/PipelineVendasShell";
import { useEmpresas } from "@/services/useEmpresas";
import {
  useCreatePessoa,
  useDeletePessoa,
  usePessoas,
  useUpdatePessoa,
  type PessoaCliente,
  type PessoaClienteInput,
} from "@/services/usePessoas";

const Pessoas = () => {
  const [selected, setSelected] = useState<number[]>([]);
  const [creatingLeads, setCreatingLeads] = useState(false);
  const user = useAuthStore(s => s.basicUserData?.id ?? s.userData?.id);
  const { data: permissions = [] } = useUsuarioPermissoes(user);
  const canCreateLeads = permissions.some(p => p.permissao.codigo === "COMERCIAL_CRIAR");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PessoaCliente | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<PessoaCliente | null>(null);
  const { data: pessoas = [], isLoading, error } = usePessoas();
  const { data: empresas = [] } = useEmpresas();
  const createPessoa = useCreatePessoa();
  const updatePessoa = useUpdatePessoa();
  const deletePessoa = useDeletePessoa();
  const isSaving = createPessoa.isPending || updatePessoa.isPending;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pessoas;
    return pessoas.filter((pessoa) => [
      pessoa.nome,
      pessoa.cpf,
      pessoa.email,
      pessoa.telefone,
      pessoa.cargo,
      ...pessoa.empresas.map((empresa) => empresa.nome),
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [pessoas, search]);

  const save = async (input: PessoaClienteInput) => {
    try {
      if (editing) await updatePessoa.mutateAsync({ id: editing.id, input });
      else await createPessoa.mutateAsync(input);
      toast.success(editing ? "Pessoa atualizada com sucesso" : "Pessoa cadastrada com sucesso");
      setEditing(undefined);
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Não foi possível salvar a pessoa");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deletePessoa.mutateAsync(deleting.id);
      toast.success("Pessoa excluída com sucesso");
      setDeleting(null);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Não foi possível excluir a pessoa");
    }
  };

  return (
    <PipelineVendasShell search={search} onSearchChange={setSearch} searchPlaceholder="Buscar pessoa, empresa, CPF ou e-mail..." activePath="/pessoas">
      <section className="p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-[22px] font-bold">Pessoas</h1><p className="mt-1 text-[12px] text-muted-foreground">Cadastre clientes e vincule cada pessoa a uma ou mais empresas.</p></div>
          <button type="button" onClick={() => setEditing(null)} className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-[12px] font-semibold text-accent-foreground"><Plus className="h-4 w-4" />Cadastrar pessoa</button>
        </div>

        {canCreateLeads && <div className="mb-4 flex items-center gap-4"><label className="text-sm"><input type="checkbox" checked={filtered.length > 0 && filtered.every(p => selected.includes(p.id))} onChange={e => setSelected(e.target.checked ? filtered.map(p => p.id) : [])} /> Selecionar pessoas exibidas</label><button disabled={!selected.length || selected.length > 100} onClick={() => setCreatingLeads(true)} className="rounded bg-accent p-2 text-sm text-accent-foreground disabled:opacity-50">Criar leads ({selected.length})</button></div>}
        <div className="overflow-hidden rounded-xl border border-border/25 bg-card/40">
          {isLoading && <div className="py-16 text-center text-[12px] text-muted-foreground">Carregando pessoas...</div>}
          {error && <div className="py-16 text-center text-[12px] text-destructive">Não foi possível carregar as pessoas.</div>}
          {!isLoading && !error && filtered.length === 0 && <div className="py-16 text-center"><UserRound className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 text-[12px] text-muted-foreground">Nenhuma pessoa encontrada.</p></div>}
          {!isLoading && !error && filtered.map((pessoa) => (
            <article key={pessoa.id} className="flex flex-wrap items-center gap-4 border-b border-border/15 px-5 py-4 last:border-b-0 hover:bg-muted/10">
              {canCreateLeads && <input aria-label={`Selecionar ${pessoa.nome}`} type="checkbox" checked={selected.includes(pessoa.id)} onChange={e => setSelected(current => e.target.checked ? [...current, pessoa.id] : current.filter(id => id !== pessoa.id))} />}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><UserRound className="h-5 w-5" /></div>
              <div className="min-w-[210px] flex-1"><div className="flex items-center gap-2"><h2 className="text-[13px] font-semibold">{pessoa.nome}</h2><span className={`rounded-full px-2 py-0.5 text-[8px] font-semibold ${pessoa.ativo ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{pessoa.ativo ? "ATIVA" : "INATIVA"}</span></div><p className="mt-1 text-[10px] text-muted-foreground">{pessoa.cargo || "Cargo não informado"} · {pessoa.email} · {pessoa.telefone}</p></div>
              <div className="flex max-w-md flex-1 flex-wrap gap-1.5">{pessoa.empresas.map((empresa) => <span key={empresa.id} title={empresa.cnpj} className="inline-flex items-center gap-1 rounded-full border border-border/25 bg-background/50 px-2.5 py-1 text-[9px] text-foreground/70"><Building2 className="h-3 w-3 text-accent" />{empresa.nome}</span>)}</div>
              <div className="flex gap-2"><button type="button" aria-label={`Editar ${pessoa.nome}`} onClick={() => setEditing(pessoa)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/25 text-muted-foreground hover:border-accent/35 hover:text-accent"><Pencil className="h-3.5 w-3.5" /></button><button type="button" aria-label={`Excluir ${pessoa.nome}`} onClick={() => setDeleting(pessoa)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/25 text-muted-foreground hover:border-destructive/35 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>
            </article>
          ))}
        </div>
      </section>

      {creatingLeads && <CriarLeadsDialog pessoas={pessoas.filter(p => selected.includes(p.id))} onClose={() => { setCreatingLeads(false); setSelected([]); }} />}
      {editing !== undefined && <PessoaClienteDialog pessoa={editing} empresas={empresas} isProcessing={isSaving} onClose={() => setEditing(undefined)} onSave={(input) => void save(input)} />}
      {deleting && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Cancelar exclusão" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => !deletePessoa.isPending && setDeleting(null)} /><section role="alertdialog" className="relative z-10 w-full max-w-md rounded-2xl border border-border/30 bg-card p-6 shadow-2xl"><h2 className="text-[16px] font-semibold">Excluir pessoa?</h2><p className="mt-2 text-[12px] text-muted-foreground">O cadastro de <strong className="text-foreground">{deleting.nome}</strong> e seus vínculos com empresas serão removidos.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDeleting(null)} disabled={deletePessoa.isPending} className="h-9 rounded-lg border border-border/30 px-4 text-[11px]">Cancelar</button><button type="button" onClick={() => void confirmDelete()} disabled={deletePessoa.isPending} className="h-9 rounded-lg bg-destructive px-4 text-[11px] font-semibold text-destructive-foreground">{deletePessoa.isPending ? "Excluindo..." : "Excluir"}</button></div></section></div>}
    </PipelineVendasShell>
  );
};

export default Pessoas;
