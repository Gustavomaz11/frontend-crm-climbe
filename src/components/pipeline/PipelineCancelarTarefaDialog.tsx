import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/api";
import { commercialError } from "@/services/usePipelineCadastros";
import type { PipelineTarefa } from "@/services/usePipelineAtividades";

import { motivosCancelamento } from "./pipelineCancelamentoOptions";

export const PipelineCancelarTarefaDialog = ({ tarefa, onClose }: { tarefa: PipelineTarefa; onClose: () => void }) => {
  const [motivo, setMotivo] = useState("");
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);
  const client = useQueryClient();
  const cancel = async () => {
    setSaving(true);
    try {
      await api.post(`/pipeline-vendas/tarefas/${tarefa.id}/cancelar`, { motivo, comentario });
      await Promise.all([client.invalidateQueries({ queryKey: ["pipeline-atividades"] }), client.invalidateQueries({ queryKey: ["pipeline-vendas"] }), client.invalidateQueries({ queryKey: ["pipeline-dashboard"] }), client.invalidateQueries({ queryKey: ["pipeline-campaigns"] })]);
      toast.success("Tarefa cancelada; a cadência pode continuar"); onClose();
    } catch (error) { toast.error(commercialError(error)); } finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={e => e.stopPropagation()}><section role="dialog" aria-modal="true" aria-label="Cancelar tarefa" className="w-full max-w-md space-y-4 rounded-xl bg-card p-6"><h2 className="font-semibold">Cancelar tarefa</h2><p className="text-sm text-muted-foreground">{tarefa.titulo}</p><label className="block text-sm">Motivo obrigatório<select className="mt-1 w-full rounded border bg-background p-2" value={motivo} onChange={e => setMotivo(e.target.value)}><option value="">Selecione</option>{Object.entries(motivosCancelamento).filter(([id]) => id !== "MOVIMENTACAO_ETAPA").map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}</select></label><label className="block text-sm">Comentário<textarea className="mt-1 w-full rounded border bg-background p-2" maxLength={1000} value={comentario} onChange={e => setComentario(e.target.value)} /></label><div className="flex justify-end gap-2"><button disabled={saving} onClick={onClose} className="rounded border p-2">Voltar</button><button disabled={!motivo || saving} onClick={() => void cancel()} className="rounded bg-destructive p-2 text-destructive-foreground disabled:opacity-50">Confirmar cancelamento</button></div></section></div>;
};
