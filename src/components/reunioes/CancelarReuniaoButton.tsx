import { useState } from "react";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { getReuniaoError, useCancelarReuniao, type Reuniao } from "@/services/useReunioes";

export const CancelarReuniaoButton = ({ reuniao }: { reuniao: Reuniao }) => {
  const cancelar = useCancelarReuniao();
  const [confirmando, setConfirmando] = useState(false);
  if (reuniao.id <= 0 || !reuniao.souOrganizador || ["CANCELADA", "CANCELADO"].includes(reuniao.status ?? "")) return null;

  if (!confirmando) return <button type="button" onClick={() => { cancelar.reset(); setConfirmando(true); }}
    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5">
    <XCircle className="h-4 w-4" />Cancelar reunião
  </button>;

  return <div role="group" aria-label="Confirmar cancelamento da reunião" className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
    <p className="text-sm font-medium">Cancelar a reunião “{reuniao.titulo}”?</p>
    <p className="text-xs text-muted-foreground">A reunião ficará marcada como cancelada.{reuniao.googleEventId && " O Google Agenda enviará o cancelamento aos participantes."}</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" autoFocus disabled={cancelar.isPending} onClick={() => setConfirmando(false)}
        className="min-h-10 rounded-lg border border-border/30 px-4 py-2 text-xs font-semibold disabled:opacity-50">Manter reunião</button>
      <button type="button" disabled={cancelar.isPending} onClick={() => cancelar.mutate(reuniao.id, {
        onSuccess: () => { setConfirmando(false); toast.success("Reunião cancelada."); },
      })} className="min-h-10 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-50">
        {cancelar.isPending ? "Cancelando..." : "Confirmar cancelamento"}
      </button>
    </div>
    {cancelar.isError && <p role="alert" className="text-xs text-destructive">{getReuniaoError(cancelar.error, "Não foi possível cancelar a reunião. Tente novamente.")}</p>}
  </div>;
};
