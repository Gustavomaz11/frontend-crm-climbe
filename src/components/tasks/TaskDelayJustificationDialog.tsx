import { useState } from "react";
import { createPortal } from "react-dom";
import { FormValidation } from "@/components/ui/form-validation";

export const TaskDelayJustificationDialog = ({ title, onClose, onConfirm }: {
  title: string;
  onClose: () => void;
  onConfirm: (justificativa: string) => Promise<void>;
}) => {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const confirm = async () => {
    if (!reason.trim() || saving) return;
    setSaving(true); setError("");
    try { await onConfirm(reason.trim()); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível concluir a tarefa. Tente novamente."); }
    finally { setSaving(false); }
  };
  return createPortal(<div role="dialog" aria-modal="true" aria-labelledby="delay-justification-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
    <FormValidation as="form" onSubmit={event => { event.preventDefault(); void confirm(); }} className="w-full max-w-lg space-y-4 rounded-xl border border-border/30 bg-card p-5 shadow-2xl">
      <h2 id="delay-justification-title" className="text-base font-semibold">Justificar atraso para concluir</h2>
      <p className="text-sm text-muted-foreground">A tarefa <strong>{title}</strong> passou do prazo. Conte o que causou o atraso antes de concluí-la.</p>
      <label className="block text-xs font-medium">Justificativa do atraso *<textarea autoFocus required maxLength={4000} disabled={saving} value={reason} onChange={e => { setReason(e.target.value); setError(""); }} className="mt-2 min-h-28 w-full rounded-lg border border-border/30 bg-background p-3 text-sm outline-none focus:border-accent" /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-border/30 px-4 py-2 text-sm">Cancelar</button><button type="submit" disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50">{saving ? "Concluindo..." : "Justificar e concluir"}</button></div>
    </FormValidation>
  </div>, document.body);
};
