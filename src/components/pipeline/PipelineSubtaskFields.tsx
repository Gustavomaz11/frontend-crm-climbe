import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { FormValidation } from "@/components/ui/form-validation";
import { UserSelect, type UserSelectOption } from "@/components/users/UserSelect";
import type { PipelineTarefaInput } from "@/services/usePipelineAtividades";

type Subtasks = PipelineTarefaInput["subtarefas"];
export const PipelineSubtaskFields = ({ value, onChange, responsaveis }: {
  value: Subtasks; onChange: (value: Subtasks) => void; responsaveis: UserSelectOption[];
}) => {
  const [title, setTitle] = useState("");
  const [responsible, setResponsible] = useState("");
  const update = (index: number, patch: Partial<Subtasks[number]>) => onChange(value.map((item, current) => current === index ? { ...item, ...patch } : item));
  const add = () => {
    const responsavelId = responsaveis.find((person) => person.id === Number(responsible))?.id ?? null;
    onChange([...value, { titulo: title.trim(), concluida: false, posicao: value.length, responsavelId }]);
    setTitle(""); setResponsible("");
  };
  return <section className="space-y-2" aria-label="Subtarefas da tarefa">
    <h3 className="text-[12px] font-semibold">Subtarefas</h3>
    <p className="text-[10px] text-muted-foreground">Selecione o responsável entre as pessoas atribuídas à tarefa principal.</p>
    {value.map((item, index) => <div key={index} className="space-y-2 rounded-lg border border-border/25 p-3">
      <div className="flex items-center gap-2"><button type="button" aria-label={`${item.concluida ? "Reabrir" : "Concluir"} subtarefa ${index + 1}`} onClick={() => update(index, { concluida: !item.concluida })} className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${item.concluida ? "border-accent bg-accent text-accent-foreground" : "border-border/50"}`}>{item.concluida && <Check className="h-3 w-3" />}</button>
        <label className="min-w-0 flex-1 text-[10px]">Título da subtarefa {index + 1} *<input required value={item.titulo} onChange={(event) => update(index, { titulo: event.target.value })} className="mt-1 w-full rounded border border-border/25 bg-background px-2 py-1 text-[11px]" /></label>
        <button type="button" aria-label={`Remover subtarefa ${index + 1}`} onClick={() => onChange(value.filter((_, current) => current !== index))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></button></div>
      <UserSelect users={responsaveis} value={item.responsavelId} onValueChange={(id) => update(index, { responsavelId: Number(id) || null })} ariaLabel={`Responsável da subtarefa ${index + 1}`} />
    </div>)}
    <FormValidation className="space-y-2 rounded-lg border border-dashed border-border/30 p-3">
      <label className="block text-[10px]">Nova subtarefa *<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Adicionar subtarefa" className="mt-1 h-8 w-full rounded border border-border/30 bg-background px-2 text-[11px]" /></label>
      <UserSelect users={responsaveis} value={responsible} onValueChange={setResponsible} ariaLabel="Responsável da nova subtarefa" />
      <button type="button" data-validate-submit onClick={add} className="flex items-center gap-2 rounded border border-border/30 px-3 py-2 text-[11px] hover:text-accent"><Plus className="h-3.5 w-3.5" />Adicionar subtarefa</button>
    </FormValidation>
  </section>;
};
