import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/api";
import { usePipelineFunisAtivos } from "@/services/usePipelineFunis";
import type { Usuario } from "@/services/useUsuarios";
import type { PipelineNegocio } from "@/services/usePipelineVendas";
import { commercialError } from "@/services/usePipelineCadastros";

export const PipelineConverterVendaDialog = ({ negocio, usuarios, onClose, onSuccess }: { negocio: PipelineNegocio; usuarios: Usuario[]; onClose: () => void; onSuccess: () => void }) => {
  const { data: funis = [] } = usePipelineFunisAtivos();
  const [funilId, setFunil] = useState("");
  const [responsavelId, setResponsavel] = useState(String(negocio.responsavelId));
  const [saving, setSaving] = useState(false);
  const client = useQueryClient();
  const vendas = funis.filter(f => f.tipo !== "PRE_VENDAS");
  const destino = funilId || String(vendas[0]?.id || "");
  const save = async () => {
    setSaving(true);
    try {
      await api.post(`/pipeline-vendas/negocios/${negocio.id}/converter-venda`, { funilId: Number(destino), responsavelId: Number(responsavelId) });
      await Promise.all([client.invalidateQueries({ queryKey: ["pipeline-vendas"] }), client.invalidateQueries({ queryKey: ["pipeline-atividades"] }), client.invalidateQueries({ queryKey: ["pipeline-dashboard"] })]);
      toast.success("Lead ganho e negócio de vendas criado em Diagnóstico"); onSuccess();
    } catch (error) { toast.error(commercialError(error)); } finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"><section role="dialog" aria-modal="true" aria-label="Ganhar pré-venda" className="w-full max-w-md space-y-4 rounded-xl bg-card p-6"><h2 className="font-semibold">Ganhar e gerar negócio</h2><p className="text-sm text-muted-foreground">O negócio entrará em Diagnóstico. O histórico da pré-venda continuará disponível.</p>
    <label className="block text-sm">Funil de vendas<select className="mt-1 w-full rounded border bg-background p-2" value={destino} onChange={e => setFunil(e.target.value)}>{vendas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>
    <label className="block text-sm">Responsável<select className="mt-1 w-full rounded border bg-background p-2" value={responsavelId} onChange={e => setResponsavel(e.target.value)}>{usuarios.map(u => <option key={u.id} value={u.id}>{u.nomeCompleto}</option>)}</select></label>
    <div className="flex justify-end gap-2"><button disabled={saving} onClick={onClose} className="rounded border p-2">Cancelar</button><button disabled={saving || !destino || !responsavelId} onClick={() => void save()} className="rounded bg-accent p-2 text-accent-foreground disabled:opacity-50">{saving ? "Gerando..." : "Ganhar e gerar negócio"}</button></div>
  </section></div>;
};
