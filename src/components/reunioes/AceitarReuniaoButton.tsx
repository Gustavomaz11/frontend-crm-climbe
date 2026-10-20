import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { getReuniaoError, useAceitarReuniao, useRejeitarReuniao, type Reuniao } from "@/services/useReunioes";

export const AceitarReuniaoButton = ({ reuniao, onAccepted }: { reuniao: Reuniao; onAccepted?: () => void }) => {
  const aceitar = useAceitarReuniao();
  const rejeitar = useRejeitarReuniao();
  if (reuniao.id <= 0 || !reuniao.minhaResposta) return null;
  const encerrada = ["CANCELADA", "CANCELADO"].includes(reuniao.status ?? "") || Boolean(reuniao.dataHoraFim && new Date(reuniao.dataHoraFim).getTime() <= Date.now());
  const ocupada = aceitar.isPending || rejeitar.isPending;
  return <div className="space-y-2">
    {reuniao.minhaResposta === "ACEITA" && <p role="status" className="flex items-center gap-2 text-xs font-medium text-emerald-400"><Check className="h-4 w-4" />Participação confirmada</p>}
    {reuniao.minhaResposta === "RECUSADA" && <p role="status" className="flex items-center gap-2 text-xs font-medium text-red-400"><X className="h-4 w-4" />Você recusou esta reunião</p>}
    {!encerrada && !reuniao.souOrganizador && <div className="flex flex-wrap gap-2">
    {reuniao.minhaResposta !== "ACEITA" && <button type="button" disabled={ocupada} onClick={() => aceitar.mutate(reuniao.id, {
      onSuccess: () => { toast.success("Participação confirmada na reunião."); onAccepted?.(); },
    })} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50">
      <Check className="h-4 w-4" />{aceitar.isPending ? "Confirmando..." : "Aceitar reunião"}
    </button>}
    {reuniao.minhaResposta !== "RECUSADA" && <button type="button" disabled={ocupada} onClick={() => rejeitar.mutate(reuniao.id, {
      onSuccess: () => { toast.success("Convite recusado. O organizador será avisado."); },
    })} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-500/50 px-4 py-2 text-xs font-semibold text-red-400 disabled:opacity-50">
      <X className="h-4 w-4" />{rejeitar.isPending ? "Recusando..." : "Rejeitar reunião"}
    </button>}
    </div>}
    {aceitar.isError && <p role="alert" className="text-xs text-destructive">{getReuniaoError(aceitar.error)}</p>}
    {rejeitar.isError && <p role="alert" className="text-xs text-destructive">{getReuniaoError(rejeitar.error)}</p>}
  </div>;
};
