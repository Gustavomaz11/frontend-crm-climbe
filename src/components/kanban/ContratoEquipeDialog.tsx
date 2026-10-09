import { useState } from "react";
import { Save, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { TaskDialogShell } from "@/components/tasks/TaskDialogShell";
import { FormValidation } from "@/components/ui/form-validation";
import { UserMultiSelect } from "@/components/users/UserMultiSelect";
import { useSalvarContratoEquipe, type ContratoEquipe } from "@/services/useContratoEquipe";
import type { UsuarioResumo } from "@/services/useContratoKanban";

export const ContratoEquipeDialog = ({ equipe, titulo, usuarios, onClose, onSaved }: {
  equipe: ContratoEquipe; titulo: string; usuarios: UsuarioResumo[]; onClose: () => void; onSaved: () => void;
}) => {
  const [ids, setIds] = useState(equipe.configurada ? equipe.membros.map(u => u.id) : equipe.responsavel ? [equipe.responsavel.id] : []);
  const save = useSalvarContratoEquipe();
  const submit = async () => {
    try {
      await save.mutateAsync({ id: equipe.contratoId, usuarioIds: ids });
      toast.success("Equipe salva. Os novos participantes foram notificados.");
      onSaved();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar a equipe."); }
  };
  return <TaskDialogShell label="Selecionar equipe do contrato" onClose={onClose} closeDisabled={save.isPending}>
    <header className="flex shrink-0 items-start justify-between border-b border-border/20 p-5"><div>
      <h2 className="flex items-center gap-2 text-base font-semibold"><UsersRound className="h-5 w-5 text-accent" />Equipe do contrato</h2>
      <p className="mt-1 text-xs text-muted-foreground">{titulo}</p></div>
      <button type="button" aria-label="Fechar seleção de equipe" disabled={save.isPending} onClick={onClose}><X className="h-5 w-5" /></button>
    </header>
    <FormValidation as="form" className="flex min-h-0 flex-1 flex-col" onSubmit={e => { e.preventDefault(); void submit(); }}>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <p className="text-sm text-muted-foreground">Selecione as pessoas que irão trabalhar no contrato. Elas poderão criar e editar tarefas, subtarefas, anexos e comentários. O líder técnico permanece na equipe.</p>
        <UserMultiSelect users={usuarios} value={ids} onChange={setIds} required label="Equipe fixa" disabled={save.isPending} />
        {!!equipe.temporarios.length && <section className="rounded-lg border border-border/25 p-4">
          <h3 className="text-sm font-semibold">Pessoas de apoio</h3>
          <p className="mt-2 text-xs text-muted-foreground">O acesso dura até concluir as tarefas atribuídas. A pessoa participa do rateio técnico de cada mês em atuação, com pagamento no mês seguinte.</p>
          {equipe.temporarios.map(p => <p key={p.usuario.id} className="mt-3 text-xs"><strong>{p.usuario.nomeCompleto}</strong><span className="ml-2 text-muted-foreground">{p.tarefas.map(t => t.titulo).join(", ")}</span></p>)}
        </section>}
      </div>
      <footer className="flex shrink-0 justify-end gap-3 border-t border-border/20 p-4"><button type="button" onClick={onClose} disabled={save.isPending} className="rounded-lg border border-border/30 px-4 py-2 text-xs">Cancelar</button>
        <button type="submit" disabled={save.isPending} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground"><Save className="h-4 w-4" />{save.isPending ? "Salvando..." : equipe.configurada ? "Salvar equipe" : "Salvar equipe e abrir kanban"}</button>
      </footer>
    </FormValidation>
  </TaskDialogShell>;
};
