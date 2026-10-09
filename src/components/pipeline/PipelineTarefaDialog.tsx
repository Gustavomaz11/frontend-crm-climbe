import { FormValidation } from "@/components/ui/form-validation";
import { useMemo, useState } from "react";
import { Save, X } from "lucide-react";
import type { PipelineTarefa, PipelineTarefaInput } from "@/services/usePipelineAtividades";
import type { Usuario } from "@/services/useUsuarios";
import { UserMultiSelect } from "@/components/users/UserMultiSelect";
import { PipelineSubtaskFields } from "./PipelineSubtaskFields";
import { TaskCollaborationPanel } from "@/components/tasks/TaskCollaborationPanel";

interface PipelineTarefaDialogProps {
  tarefa?: PipelineTarefa | null;
  usuarios: Usuario[];
  defaultResponsavelId: number;
  isProcessing: boolean;
  onClose: () => void;
  onSave: (input: PipelineTarefaInput) => void;
}

const inputClass = "h-9 w-full rounded-lg border border-border/30 bg-background px-3 text-[11px] outline-none focus:border-accent/45";
const textAreaClass = "w-full rounded-lg border border-border/30 bg-background px-3 py-2 text-[11px] outline-none focus:border-accent/45";
const taskTypes = ["Follow-up", "Ligação", "Reunião", "E-mail", "Proposta", "Documentação"];

export const PipelineTarefaDialog = ({
  tarefa,
  usuarios,
  defaultResponsavelId,
  isProcessing,
  onClose,
  onSave,
}: PipelineTarefaDialogProps) => {
  const initialDraft = useMemo<PipelineTarefaInput>(() => ({
    titulo: tarefa?.titulo || "",
    descricao: tarefa?.descricao || "",
    responsavelId: tarefa?.responsavelId || defaultResponsavelId,
    responsavelIds: tarefa?.responsaveis?.length ? tarefa.responsaveis.map((user) => user.id) : [tarefa?.responsavelId || defaultResponsavelId].filter(Boolean),
    dataInicio: tarefa?.dataInicio || "",
    prazo: tarefa?.prazo || "",
    prioridade: tarefa?.prioridade || "MEDIA",
    status: tarefa?.status || "PENDENTE",
    tipo: tarefa?.tipo || "Follow-up",
    observacoes: tarefa?.observacoes || "",
    subtarefas: (tarefa?.subtarefas || []).map(({ titulo, concluida, posicao, responsavel }) => ({ titulo, concluida, posicao, responsavelId: responsavel?.id ?? null })),
  }), [defaultResponsavelId, tarefa]);
  const [draft, setDraft] = useState(initialDraft);
  const responsaveis = usuarios.filter((user) => draft.responsavelIds?.includes(user.id));


  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <FormValidation as="section" role="dialog" aria-modal="true" aria-label={tarefa ? "Editar tarefa" : "Nova tarefa"} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/30 bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border/20 px-5 py-4">
          <div><h3 className="text-sm font-semibold">{tarefa ? "Editar tarefa" : "Nova tarefa"}</h3><p className="mt-0.5 text-[10px] text-muted-foreground">Organize a próxima ação desta negociação.</p></div>
          <button type="button" onClick={onClose} disabled={isProcessing} className="rounded-lg p-2 hover:bg-muted/30"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-4 overflow-y-auto p-5">
          <label className="block text-[10px] font-medium">Título *<input required className={`${inputClass} mt-1`} value={draft.titulo} onChange={(event) => setDraft({ ...draft, titulo: event.target.value })} placeholder="Ex.: Enviar proposta revisada" /></label>
          <label className="block text-[10px] font-medium">Descrição<textarea className={`${textAreaClass} mt-1 min-h-20`} value={draft.descricao || ""} onChange={(event) => setDraft({ ...draft, descricao: event.target.value })} /></label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><UserMultiSelect required users={usuarios.filter((usuario) => !usuario.situacao || usuario.situacao === "ATIVO")} value={draft.responsavelIds || []} onChange={(responsavelIds) => setDraft({ ...draft, responsavelIds, responsavelId: responsavelIds[0] || 0, subtarefas: draft.subtarefas.map((item) => ({ ...item, responsavelId: item.responsavelId && responsavelIds.includes(item.responsavelId) ? item.responsavelId : null })) })} /></div>
            <label className="text-[10px] font-medium">Tipo *<select required className={`${inputClass} mt-1`} value={draft.tipo} onChange={(event) => setDraft({ ...draft, tipo: event.target.value })}>{taskTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label className="text-[10px] font-medium">Data de início<input type="date" className={`${inputClass} mt-1`} value={draft.dataInicio || ""} onChange={(event) => setDraft({ ...draft, dataInicio: event.target.value })} /></label>
            <label className="text-[10px] font-medium">Prazo *<input type="date" required min={draft.dataInicio || undefined} className={`${inputClass} mt-1`} value={draft.prazo || ""} onChange={(event) => setDraft({ ...draft, prazo: event.target.value })} /></label>
            <label className="text-[10px] font-medium">Prioridade *<select required className={`${inputClass} mt-1`} value={draft.prioridade} onChange={(event) => setDraft({ ...draft, prioridade: event.target.value as PipelineTarefaInput["prioridade"] })}><option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option></select></label>
            <label className="text-[10px] font-medium">Status *<select required className={`${inputClass} mt-1`} disabled={!!tarefa?.campanhaId && ["CANCELADA", "CONCLUIDA"].includes(tarefa.status)} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as PipelineTarefaInput["status"] })}><option value="PENDENTE">Pendente</option><option value="EM_ANDAMENTO">Em andamento</option><option value="CONCLUIDA">Concluída</option>{tarefa?.status === "CANCELADA" && <option value="CANCELADA">Cancelada</option>}</select></label>
          </div>

          <PipelineSubtaskFields value={draft.subtarefas} onChange={(subtarefas) => setDraft({ ...draft, subtarefas })} responsaveis={responsaveis} />

          <label className="block text-[10px] font-medium">Observações<textarea className={`${textAreaClass} mt-1 min-h-16`} value={draft.observacoes || ""} onChange={(event) => setDraft({ ...draft, observacoes: event.target.value })} /></label>
          {draft.dataInicio && draft.prazo && draft.prazo < draft.dataInicio && <p className="text-[10px] text-destructive">O prazo não pode ser anterior à data de início.</p>}
          {tarefa && <TaskCollaborationPanel tipo="COMERCIAL" taskId={tarefa.id} />}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border/20 px-5 py-4"><button type="button" onClick={onClose} disabled={isProcessing} className="h-9 rounded-lg border border-border/30 px-4 text-[11px]">Cancelar</button><button data-validate-submit type="button" onClick={() => onSave({ ...draft, titulo: draft.titulo.trim(), tipo: draft.tipo.trim(), subtarefas: draft.subtarefas.filter((item) => item.titulo.trim()).map((item, index) => ({ ...item, titulo: item.titulo.trim(), posicao: index })) })} disabled={isProcessing} className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[11px] font-semibold text-accent-foreground disabled:opacity-50"><Save className="h-3.5 w-3.5" />{isProcessing ? "Salvando..." : "Salvar tarefa"}</button></footer>
      </FormValidation>
    </div>
  );
};
