import { useCallback, useMemo, useState, type DragEvent } from "react";
import { Plus } from "lucide-react";
import type { PipelineEtapa, PipelineNegocio } from "@/services/usePipelineVendas";
import { PipelineNegocioCard } from "./PipelineNegocioCard";

interface PipelineKanbanBoardProps {
  etapas: PipelineEtapa[];
  canMove: boolean;
  canCreate: boolean;
  movingBusinessId?: number;
  onOpen: (negocio: PipelineNegocio) => void;
  onAdd: (etapaId: number) => void;
  onMove: (negocio: PipelineNegocio, etapaId: number) => Promise<void>;
}

export const PipelineKanbanBoard = ({
  etapas,
  canMove,
  canCreate,
  movingBusinessId,
  onOpen,
  onAdd,
  onMove,
}: PipelineKanbanBoardProps) => {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<number | null>(null);
  const businessesById = useMemo(
    () => new Map(etapas.flatMap((stage) => stage.negocios).map((business) => [business.id, business])),
    [etapas],
  );

  const startDragging = useCallback((event: DragEvent<HTMLButtonElement>, businessId: number) => {
    setDraggedId(businessId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/pipeline-business-id", String(businessId));
  }, []);

  const drop = async (stageId: number) => {
    setDragOverStage(null);
    const transferredId = draggedId;
    setDraggedId(null);
    if (transferredId === null) return;

    const business = businessesById.get(transferredId);
    if (!business || business.etapaId === stageId) return;
    await onMove(business, stageId);
  };

  return (
    <div className="flex min-h-[540px] gap-4 overflow-x-auto pb-4">
      {etapas.map((stage) => {
        const isDragTarget = dragOverStage === stage.id;
        return (
          <div
            key={stage.id}
            onDragOver={(event) => {
              if (!canMove) return;
              event.preventDefault();
              setDragOverStage((current) => current === stage.id ? current : stage.id);
            }}
            onDragLeave={() => setDragOverStage((current) => current === stage.id ? null : current)}
            onDrop={() => void drop(stage.id)}
            className={`flex w-[290px] shrink-0 flex-col rounded-xl border bg-card/35 transition-all ${isDragTarget ? "border-accent/50 bg-accent/5" : "border-border/25"}`}
          >
            <header className="flex items-center justify-between border-b border-border/20 px-3 py-3">
              <div>
                <h2 className="text-[12px] font-semibold">{stage.nome}</h2>
                <p className="mt-0.5 text-[9px] text-muted-foreground">{stage.negocios.length} negócio(s)</p>
              </div>
              <span className={`h-2 w-2 rounded-full ${stage.resultado === "GANHO" ? "bg-emerald-500" : stage.resultado === "PERDIDO" ? "bg-red-500" : "bg-accent/60"}`} />
            </header>
            <div className="flex-1 space-y-2 p-3">
              {stage.negocios.map((business) => (
                <PipelineNegocioCard
                  key={business.id}
                  negocio={business}
                  canMove={canMove && movingBusinessId !== business.id}
                  isMoving={movingBusinessId === business.id}
                  onOpen={onOpen}
                  onDragStart={startDragging}
                />
              ))}
              {stage.negocios.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/25 py-10 text-center text-[10px] text-muted-foreground">Sem negócios</div>
              )}
            </div>
            {canCreate && stage.resultado === "ABERTO" && (
              <button type="button" onClick={() => onAdd(stage.id)} className="m-3 mt-0 flex h-9 items-center justify-center gap-2 rounded-lg border border-dashed border-border/30 text-[11px] text-muted-foreground hover:border-accent/35 hover:text-accent">
                <Plus className="h-3.5 w-3.5" />Adicionar negócio
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
