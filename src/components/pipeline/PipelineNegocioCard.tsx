import { Building2, CalendarDays, CircleDollarSign, LoaderCircle, MessageSquareWarning, UserRound } from "lucide-react";
import { memo, type DragEvent } from "react";
import type { PipelineNegocio } from "@/services/usePipelineVendas";

interface PipelineNegocioCardProps {
  negocio: PipelineNegocio;
  canMove: boolean;
  isMoving?: boolean;
  onOpen: (negocio: PipelineNegocio) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, negocioId: number) => void;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatCurrency = (value?: number | null) => {
  if (!value) return "Valor não informado";
  return currencyFormatter.format(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return "Reunião não definida";
  return dateFormatter.format(new Date(value));
};

export const PipelineNegocioCard = memo(({ negocio, canMove, isMoving, onOpen, onDragStart }: PipelineNegocioCardProps) => (
  <button
    type="button"
    draggable={canMove}
    aria-busy={isMoving}
    onDragStart={(event) => onDragStart(event, negocio.id)}
    onClick={() => onOpen(negocio)}
    className={`w-full cursor-pointer rounded-xl border p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${negocio.propostaAjustesPendentes ? "border-amber-500/55 bg-amber-500/10 ring-1 ring-amber-500/20 hover:border-amber-400" : "border-border/25 bg-background/70 hover:border-accent/35"}`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-foreground">{negocio.nomeEmpresa}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{negocio.servicoInteresse}</p>
      </div>
      <div className="flex max-w-[55%] flex-wrap justify-end gap-1.5">
        {negocio.propostaAjustesPendentes && (
          <span className="flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-1 text-[8px] font-semibold text-amber-500">
            <MessageSquareWarning className="h-3 w-3" />Cliente solicitou ajustes
          </span>
        )}
        {isMoving ? (
          <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[8px] font-semibold text-accent">
            <LoaderCircle className="h-3 w-3 animate-spin" />Salvando...
          </span>
        ) : negocio.resultado !== "ABERTO" && (
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${negocio.resultado === "GANHO" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
            {negocio.resultado === "GANHO" ? "Ganho" : "Perdido"}
          </span>
        )}
      </div>
    </div>

    <div className="mt-3 space-y-1.5 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-1.5"><UserRound className="h-3 w-3" /><span className="truncate">{negocio.nomeContato}</span></div>
      <div className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /><span className="truncate">{formatDate(negocio.dataReuniao)}</span></div>
      <div className="flex items-center gap-1.5"><CircleDollarSign className="h-3 w-3" /><span className="truncate">{formatCurrency(negocio.valorEstimadoProposta)}</span></div>
      <div className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /><span className="truncate">{negocio.responsavelNome}</span></div>
    </div>
  </button>
));

PipelineNegocioCard.displayName = "PipelineNegocioCard";
