import { Check } from "lucide-react";
import { toast } from "sonner";
import { getReuniaoError, useAceitarReuniao, type Reuniao } from "@/services/useReunioes";

export const AceitarReuniaoButton = ({ reuniao, onAccepted }: { reuniao: Reuniao; onAccepted?: () => void }) => {
  const aceitar = useAceitarReuniao();
  if (reuniao.id <= 0 || !reuniao.minhaResposta) return null;
  if (reuniao.minhaResposta === "ACEITA") return <p role="status" className="flex items-center gap-2 text-xs font-medium text-accent"><Check className="h-4 w-4" />Participação confirmada</p>;
  if (["CANCELADA", "CANCELADO"].includes(reuniao.status ?? "") || reuniao.dataHoraFim && new Date(reuniao.dataHoraFim).getTime() <= Date.now()) return null;
  return <div className="space-y-2">
    <button type="button" disabled={aceitar.isPending} onClick={() => aceitar.mutate(reuniao.id, {
      onSuccess: () => { toast.success("Participação confirmada na reunião."); onAccepted?.(); },
    })} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50">
      <Check className="h-4 w-4" />{aceitar.isPending ? "Confirmando..." : "Aceitar reunião"}
    </button>
    {aceitar.isError && <p role="alert" className="text-xs text-destructive">{getReuniaoError(aceitar.error)}</p>}
  </div>;
};
