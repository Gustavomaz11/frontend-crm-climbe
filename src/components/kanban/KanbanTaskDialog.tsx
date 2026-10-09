import { FormValidation } from "@/components/ui/form-validation";
import { CalendarDays, X } from "lucide-react";
import type { KanbanTaskPrioridade, UsuarioResumo } from "@/services";
import { UserMultiSelect } from "@/components/users/UserMultiSelect";
import { TaskDialogShell } from "@/components/tasks/TaskDialogShell";
import { kanbanPriorityOptions } from "./kanbanPriority";

export interface KanbanTaskDraft {
  titulo: string;
  descricao: string;
  prioridade: KanbanTaskPrioridade;
  responsavelId: string;
  responsavelIds?: number[];
  dataInicio: string;
  dataFim: string;
}

interface KanbanTaskDialogProps {
  assignmentHint?: string;
  raiaTitulo: string;
  draft: KanbanTaskDraft;
  usuarios: UsuarioResumo[];
  isSaving: boolean;
  onChange: (draft: KanbanTaskDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const KanbanTaskDialog = ({
  assignmentHint,
  raiaTitulo,
  draft,
  usuarios,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}: KanbanTaskDialogProps) => (
  <TaskDialogShell label="Nova tarefa" onClose={onClose} closeDisabled={isSaving}>
      <header className="flex shrink-0 items-center justify-between border-b border-border/20 p-5">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">Nova tarefa</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{raiaTitulo}</p>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </header>

      <FormValidation as="form"
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Título *</span>
          <input required value={draft.titulo} onChange={(event) => onChange({ ...draft, titulo: event.target.value })} placeholder="Nome da tarefa" className="h-9 w-full rounded-lg border border-border/25 bg-background/60 px-3 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40" />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Descrição</span>
          <textarea value={draft.descricao} onChange={(event) => onChange({ ...draft, descricao: event.target.value })} placeholder="Detalhes, contexto e resultado esperado" className="min-h-[88px] w-full rounded-lg border border-border/25 bg-background/60 px-3 py-2 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Prioridade *</span>
            <select required value={draft.prioridade} onChange={(event) => onChange({ ...draft, prioridade: event.target.value as KanbanTaskPrioridade })} className="h-9 w-full rounded-lg border border-border/25 bg-background/60 px-3 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40">
              {kanbanPriorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div>
            <UserMultiSelect
              users={usuarios}
              value={draft.responsavelIds ?? (draft.responsavelId ? [Number(draft.responsavelId)] : [])}
              onChange={(responsavelIds) => onChange({ ...draft, responsavelIds, responsavelId: String(responsavelIds[0] || "") })}
            />
            {assignmentHint && <p className="mt-2 text-xs text-muted-foreground">{assignmentHint}</p>}
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

        </div>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-border/25 p-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-border/30 px-4 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground">Cancelar</button>
          <button type="submit" disabled={isSaving} className="h-9 rounded-lg bg-accent px-4 text-[12px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">
            {isSaving ? "Criando..." : "Criar tarefa"}
          </button>
        </footer>
      </FormValidation>
  </TaskDialogShell>
);
