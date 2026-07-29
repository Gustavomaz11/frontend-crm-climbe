import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { PipelineMotivoPerda } from "@/services/usePipelineMotivosPerda";

interface Props {
  empresa: string;
  motivos: PipelineMotivoPerda[];
  isProcessing: boolean;
  onCancel: () => void;
  onConfirm: (motivoId: number, observacao?: string) => void;
}

export const PipelinePerdaDialog = ({ empresa, motivos, isProcessing, onCancel, onConfirm }: Props) => {
  const [motivoId, setMotivoId] = useState("");
  const [observacao, setObservacao] = useState("");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" aria-label="Cancelar perda" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onCancel} />
      <section role="dialog" aria-modal="true" className="relative z-10 w-full max-w-lg rounded-2xl border border-border/30 bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3"><span className="rounded-xl bg-red-500/10 p-2.5 text-red-500"><AlertTriangle className="h-5 w-5" /></span><div><h2 className="text-sm font-semibold">Marcar negócio como perdido</h2><p className="mt-1 text-[11px] text-muted-foreground">Informe por que {empresa} não avançou. O negócio poderá ser reativado depois.</p></div></div>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <label className="mt-5 block text-[11px] font-medium">Motivo da perda <span className="text-red-500">*</span><select value={motivoId} onChange={(event) => setMotivoId(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border/30 bg-background px-3 text-xs outline-none"><option value="">Selecione um motivo</option>{motivos.map((motivo) => <option key={motivo.id} value={motivo.id}>{motivo.nome}</option>)}</select></label>
        <label className="mt-4 block text-[11px] font-medium">Observação<textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} maxLength={500} rows={4} placeholder="Contexto adicional da perda" className="mt-2 w-full resize-none rounded-lg border border-border/30 bg-background p-3 text-xs outline-none" /></label>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="h-9 rounded-lg border border-border/30 px-4 text-[11px]">Cancelar</button><button type="button" disabled={!motivoId || isProcessing} onClick={() => onConfirm(Number(motivoId), observacao.trim() || undefined)} className="h-9 rounded-lg bg-red-500 px-4 text-[11px] font-semibold text-white disabled:opacity-50">{isProcessing ? "Salvando..." : "Confirmar perda"}</button></div>
      </section>
    </div>
  );
};
