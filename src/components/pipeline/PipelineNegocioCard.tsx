import { Building2, CalendarDays, CircleDollarSign, LoaderCircle, UserRound } from "lucide-react";
import type { DragEvent } from "react";
import type { PipelineNegocio } from "@/services/usePipelineVendas";

interface PipelineNegocioCardProps {
  negocio: PipelineNegocio;
  canMove: boolean;
  isMoving?: boolean;
  onOpen: () => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
}

const formatCurrency = (value?: number | null) => {
  if (!value) return "Valor não informado";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return "Reunião não definida";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
};

export const PipelineNegocioCard = ({ negocio, canMove, isMoving, onOpen, onDragStart }: PipelineNegocioCardProps) => (
  <button
    type="button"
    draggable={canMove}
    aria-busy={isMoving}
    onDragStart={onDragStart}
    onClick={onOpen}
    className="w-full cursor-pointer rounded-xl border border-border/25 bg-background/70 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-md active:translate-y-0"
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-foreground">{negocio.nomeEmpresa}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground/55">{negocio.servicoInteresse}</p>
      </div>
      {isMoving ? (
        <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[8px] font-semibold text-accent">
          <LoaderCircle className="h-3 w-3 animate-spin" />
          Salvando...
        </span>
      ) : negocio.resultado !== "ABERTO" && (
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${negocio.resultado === "GANHO" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
          {negocio.resultado === "GANHO" ? "Ganho" : "Perdido"}
        </span>
      )}
    </div>

    <div className="mt-3 space-y-1.5 text-[10px] text-muted-foreground/60">
      <div className="flex items-center gap-1.5"><UserRound className="h-3 w-3" /><span className="truncate">{negocio.nomeContato}</span></div>
      <div className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /><span className="truncate">{formatDate(negocio.dataReuniao)}</span></div>
      <div className="flex items-center gap-1.5"><CircleDollarSign className="h-3 w-3" /><span className="truncate">{formatCurrency(negocio.valorEstimadoProposta)}</span></div>
      <div className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /><span className="truncate">{negocio.responsavelNome}</span></div>
    </div>
  </button>
);
