import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/api";
import { commercialError } from "@/services/usePipelineCadastros";
export const PipelineReiniciarCadencia = ({ id }: { id: number }) => {
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const client = useQueryClient();
  const restart = async () => {
    setSaving(true);
    try { await api.post(`/pipeline-vendas/negocios/${id}/reiniciar-cadencia`); await Promise.all([client.invalidateQueries({ queryKey: ["pipeline-vendas"] }), client.invalidateQueries({ queryKey: ["pipeline-atividades"] })]); toast.success("Cadência reiniciada"); setConfirming(false); }
    catch (error) { toast.error(commercialError(error)); } finally { setSaving(false); }
  };
  return <div className="mb-4 rounded border border-amber-500/30 p-3 text-sm">{confirming ? <><p>Iniciar novamente as atividades desta etapa usando a configuração atual da campanha?</p><button disabled={saving} onClick={() => void restart()} className="mt-2 mr-3 underline">Confirmar reinício</button><button onClick={() => setConfirming(false)}>Voltar</button></> : <button onClick={() => setConfirming(true)} className="underline">Reiniciar cadência desta etapa</button>}</div>;
};
