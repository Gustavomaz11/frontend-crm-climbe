import { CalendarDays, X } from "lucide-react";
import type { KanbanTaskPrioridade, UsuarioResumo } from "@/services";
import { UserSelect } from "@/components/users/UserSelect";
import { kanbanPriorityOptions } from "./kanbanPriority";

export interface KanbanTaskDraft {
  titulo: string;
  descricao: string;
  prioridade: KanbanTaskPrioridade;
  responsavelId: string;
  dataInicio: string;
  dataFim: string;
}

interface KanbanTaskDialogProps {
  raiaTitulo: string;
  draft: KanbanTaskDraft;
  usuarios: UsuarioResumo[];
  isSaving: boolean;
  onChange: (draft: KanbanTaskDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const KanbanTaskDialog = ({
  raiaTitulo,
  draft,
  usuarios,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}: KanbanTaskDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
    <button type="button" aria-label="Fechar formulário" className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
    <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border/30 bg-card/95 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-border/20 p-5">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">Nova tarefa</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{raiaTitulo}</p>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form
        className="space-y-3 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Título</span>
          <input required value={draft.titulo} onChange={(event) => onChange({ ...draft, titulo: event.target.value })} placeholder="Nome da tarefa" className="h-9 w-full rounded-lg border border-border/25 bg-background/60 px-3 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40" />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Descrição</span>
          <textarea value={draft.descricao} onChange={(event) => onChange({ ...draft, descricao: event.target.value })} placeholder="Detalhes, contexto e resultado esperado" className="min-h-[88px] w-full rounded-lg border border-border/25 bg-background/60 px-3 py-2 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Prioridade</span>
            <select value={draft.prioridade} onChange={(event) => onChange({ ...draft, prioridade: event.target.value as KanbanTaskPrioridade })} className="h-9 w-full rounded-lg border border-border/25 bg-background/60 px-3 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40">
              {kanbanPriorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Responsável</span>
            <UserSelect
              users={usuarios}
              value={draft.responsavelId}
              onValueChange={(responsavelId) => onChange({ ...draft, responsavelId })}
              placeholder="Sem responsável"
              emptyLabel="Sem responsável"
              ariaLabel="Responsável"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Início</span>
            <span className="relative block">
              <CalendarDays className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input type="date" value={draft.dataInicio} onChange={(event) => onChange({ ...draft, dataInicio: event.target.value })} className="h-9 w-full rounded-lg border border-border/25 bg-background/60 pl-8 pr-2 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40" />
            </span>
          </label>
          <label>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Fim</span>
            <input type="date" value={draft.dataFim} onChange={(event) => onChange({ ...draft, dataFim: event.target.value })} className="h-9 w-full rounded-lg border border-border/25 bg-background/60 px-2 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40" />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border/30 px-4 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground">Cancelar</button>
          <button type="submit" disabled={isSaving} className="h-9 rounded-lg bg-accent px-4 text-[12px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">
            {isSaving ? "Criando..." : "Criar tarefa"}
          </button>
        </div>
      </form>
    </div>
  </div>
);
