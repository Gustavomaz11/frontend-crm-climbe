import { useState } from "react";
import { Plus } from "lucide-react";
import type { PipelineEtapa, PipelineNegocio } from "@/services/usePipelineVendas";
import { PipelineNegocioCard } from "./PipelineNegocioCard";

interface PipelineKanbanBoardProps {
  etapas: PipelineEtapa[];
  canMove: boolean;
  canCreate: boolean;
  onOpen: (negocio: PipelineNegocio) => void;
  onAdd: (etapaId: number) => void;
  onMove: (negocio: PipelineNegocio, etapaId: number) => Promise<void>;
}

export const PipelineKanbanBoard = ({ etapas, canMove, canCreate, onOpen, onAdd, onMove }: PipelineKanbanBoardProps) => {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<number | null>(null);
  const businesses = etapas.flatMap((stage) => stage.negocios);

  const drop = async (stageId: number) => {
    setDragOverStage(null);
    const business = businesses.find((item) => item.id === draggedId);
    setDraggedId(null);
    if (!business || business.etapaId === stageId) return;
    await onMove(business, stageId);
  };

  return (
    <div className="flex min-h-[540px] gap-4 overflow-x-auto pb-4">
      {etapas.map((stage) => <div key={stage.id} onDragOver={(event) => { if (canMove) { event.preventDefault(); setDragOverStage(stage.id); } }} onDragLeave={() => setDragOverStage((current) => current === stage.id ? null : current)} onDrop={() => void drop(stage.id)} className={`flex w-[290px] shrink-0 flex-col rounded-xl border bg-card/35 transition-all ${dragOverStage === stage.id ? "border-accent/50 bg-accent/5" : "border-border/25"}`}>
        <header className="flex items-center justify-between border-b border-border/20 px-3 py-3"><div><h2 className="text-[12px] font-semibold">{stage.nome}</h2><p className="mt-0.5 text-[9px] text-muted-foreground/45">{stage.negocios.length} negócio(s)</p></div><span className={`h-2 w-2 rounded-full ${stage.resultado === "GANHO" ? "bg-emerald-500" : stage.resultado === "PERDIDO" ? "bg-red-500" : "bg-accent/60"}`} /></header>
        <div className="flex-1 space-y-2 p-3">{stage.negocios.map((business) => <PipelineNegocioCard key={business.id} negocio={business} canMove={canMove} onOpen={() => onOpen(business)} onDragStart={(event) => { setDraggedId(business.id); event.dataTransfer.effectAllowed = "move"; }} />)}{stage.negocios.length === 0 && <div className="rounded-lg border border-dashed border-border/25 py-10 text-center text-[10px] text-muted-foreground/35">Sem negócios</div>}</div>
        {canCreate && stage.resultado === "ABERTO" && <button type="button" onClick={() => onAdd(stage.id)} className="m-3 mt-0 flex h-9 items-center justify-center gap-2 rounded-lg border border-dashed border-border/30 text-[11px] text-muted-foreground hover:border-accent/35 hover:text-accent"><Plus className="h-3.5 w-3.5" />Adicionar negócio</button>}
      </div>)}
    </div>
  );
};
