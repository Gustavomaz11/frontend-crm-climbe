import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Save, X } from "lucide-react";
import type { Empresa } from "@/services/useEmpresas";
import type { PessoaCliente, PessoaClienteInput } from "@/services/usePessoas";

interface PessoaClienteDialogProps {
  pessoa: PessoaCliente | null;
  empresas: Empresa[];
  isProcessing: boolean;
  onClose: () => void;
  onSave: (input: PessoaClienteInput) => void;
}

const emptyInput: PessoaClienteInput = {
  nome: "",
  cpf: "",
  email: "",
  telefone: "",
  cargo: "",
  observacoes: "",
  ativo: true,
  empresaIds: [],
};

const inputClass = "h-10 w-full rounded-lg border border-border/30 bg-background/70 px-3 text-[12px] outline-none focus:border-accent/45 disabled:opacity-60";
const labelClass = "mb-1.5 block text-[10px] font-medium text-muted-foreground";

const formatCpf = (value: string) => value.replace(/\D/g, "").slice(0, 11)
  .replace(/(\d{3})(\d)/, "$1.$2")
  .replace(/(\d{3})(\d)/, "$1.$2")
  .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const PessoaClienteDialog = ({ pessoa, empresas, isProcessing, onClose, onSave }: PessoaClienteDialogProps) => {
  const initial = useMemo<PessoaClienteInput>(() => pessoa ? {
    nome: pessoa.nome,
    cpf: pessoa.cpf || "",
    email: pessoa.email,
    telefone: pessoa.telefone,
    cargo: pessoa.cargo || "",
    observacoes: pessoa.observacoes || "",
    ativo: pessoa.ativo,
    empresaIds: pessoa.empresas.map((empresa) => empresa.id),
  } : emptyInput, [pessoa]);
  const [form, setForm] = useState(initial);

  useEffect(() => setForm(initial), [initial]);

  const update = <Field extends keyof PessoaClienteInput>(field: Field, value: PessoaClienteInput[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleEmpresa = (empresaId: number) => {
    update("empresaIds", form.empresaIds.includes(empresaId)
      ? form.empresaIds.filter((id) => id !== empresaId)
      : [...form.empresaIds, empresaId]);
  };

  const valid = Boolean(form.nome.trim() && form.email.trim() && form.telefone.trim() && form.empresaIds.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => !isProcessing && onClose()} />
      <section role="dialog" aria-modal="true" className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border/30 bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border/20 px-6 py-4">
          <div><h2 className="text-[16px] font-semibold">{pessoa ? "Editar pessoa" : "Cadastrar pessoa"}</h2><p className="mt-1 text-[10px] text-muted-foreground">Vincule o cliente a uma ou mais empresas.</p></div>
          <button type="button" onClick={onClose} disabled={isProcessing} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/30"><X className="h-4 w-4" /></button>
        </header>
        <div className="overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label><span className={labelClass}>Nome completo *</span><input className={inputClass} value={form.nome} onChange={(event) => update("nome", event.target.value)} disabled={isProcessing} /></label>
            <label><span className={labelClass}>CPF</span><input className={inputClass} value={form.cpf} onChange={(event) => update("cpf", formatCpf(event.target.value))} disabled={isProcessing} inputMode="numeric" placeholder="000.000.000-00" /></label>
            <label><span className={labelClass}>E-mail *</span><input type="email" className={inputClass} value={form.email} onChange={(event) => update("email", event.target.value)} disabled={isProcessing} /></label>
            <label><span className={labelClass}>Telefone *</span><input className={inputClass} value={form.telefone} onChange={(event) => update("telefone", event.target.value)} disabled={isProcessing} /></label>
            <label className="md:col-span-2"><span className={labelClass}>Cargo na empresa</span><input className={inputClass} value={form.cargo} onChange={(event) => update("cargo", event.target.value)} disabled={isProcessing} placeholder="Ex.: Diretor Financeiro" /></label>
          </div>

          <div className="mt-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold"><Building2 className="h-4 w-4 text-accent" />Empresas vinculadas *</p>
            <p className="mt-1 text-[9px] text-muted-foreground">Selecione todas as empresas que esta pessoa representa.</p>
            <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-border/25 bg-background/35 p-3 sm:grid-cols-2">
              {empresas.map((empresa) => {
                const selected = form.empresaIds.includes(empresa.id);
                return <button key={empresa.id} type="button" disabled={isProcessing} onClick={() => toggleEmpresa(empresa.id)} className={`flex items-center gap-3 rounded-lg border p-3 text-left ${selected ? "border-accent/35 bg-accent/8" : "border-border/20 hover:border-border/40"}`}><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-accent bg-accent text-accent-foreground" : "border-border/40"}`}>{selected && <Check className="h-3 w-3" />}</span><span className="min-w-0"><strong className="block truncate text-[11px]">{empresa.nome}</strong><span className="text-[9px] text-muted-foreground">{empresa.cnpj}</span></span></button>;
              })}
              {empresas.length === 0 && <p className="col-span-full py-4 text-center text-[10px] text-muted-foreground">Cadastre uma empresa antes de cadastrar pessoas.</p>}
            </div>
          </div>

          <label className="mt-4 block"><span className={labelClass}>Observações</span><textarea className={`${inputClass} min-h-24 py-2.5`} value={form.observacoes} onChange={(event) => update("observacoes", event.target.value)} disabled={isProcessing} /></label>
          <label className="mt-4 flex items-center gap-2 text-[11px]"><input type="checkbox" checked={form.ativo} onChange={(event) => update("ativo", event.target.checked)} disabled={isProcessing} className="h-4 w-4 accent-[hsl(var(--accent))]" />Pessoa ativa</label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border/20 px-6 py-4"><button type="button" onClick={onClose} disabled={isProcessing} className="h-9 rounded-lg border border-border/30 px-4 text-[11px] text-muted-foreground">Cancelar</button><button type="button" onClick={() => onSave(form)} disabled={!valid || isProcessing} className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[11px] font-semibold text-accent-foreground disabled:opacity-40"><Save className="h-3.5 w-3.5" />{isProcessing ? "Salvando..." : "Salvar pessoa"}</button></footer>
      </section>
    </div>
  );
};
