import { useState } from "react";
import { FileText, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useMoveContratoPreparacao, type Contrato } from "@/services/useContratos";
import { CONTRATO_PREPARACAO_COLUNAS, getContratoPreparacaoEtapa, getContratoPreparacaoTitulo } from "@/services/contratoPreparacao";
import { formatProposalMoney } from "@/services/proposalPayments";

export function ContratoPreparacaoBoard({ contratos, canEdit, onOpen }: {
  contratos: Contrato[]; canEdit: boolean; onOpen: (contrato: Contrato) => void;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const move = useMoveContratoPreparacao();
  return <div className="overflow-x-auto pb-4"><div className="grid min-w-[1040px] grid-cols-4 gap-4">
    {CONTRATO_PREPARACAO_COLUNAS.map(coluna => {
      const cards = contratos.filter(c => getContratoPreparacaoEtapa(c) === coluna.id);
      return <section key={coluna.id} aria-label={coluna.nome} onDragOver={e => { if (dragging !== null) e.preventDefault(); }} onDrop={async e => {
        e.preventDefault(); const id = dragging; setDragging(null); if (id === null || move.isPending) return;
        try { await move.mutateAsync({ id, etapa: coluna.id }); toast.success(`Contrato movido para ${coluna.nome}`); }
        catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível mover o contrato"); }
      }} className="min-w-0 rounded-xl border border-border/25 bg-card/50 p-3">
        <header className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold">{coluna.nome}</h2><span className="rounded-md bg-muted/30 px-2 py-1 text-xs text-muted-foreground">{cards.length}</span></header>
        <div className="min-h-56 space-y-3">{cards.length ? cards.map(contrato => <button key={contrato.id} type="button" draggable={canEdit && !move.isPending && contrato.status !== "APROVADO"} onDragStart={e => { setDragging(contrato.id); e.dataTransfer.setData("text/plain", String(contrato.id)); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDragging(null)} onClick={() => onOpen(contrato)} className="w-full rounded-xl border border-border/25 bg-background/70 p-4 text-left transition-colors hover:border-accent/50 focus-visible:outline focus-visible:outline-accent">
          <div className="mb-2 flex items-center justify-between text-accent"><FileText className="h-4 w-4" /><span className="text-[10px] text-muted-foreground">CT-{contrato.id}</span>{canEdit && <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />}</div>
          <h3 className="break-words text-xs font-semibold leading-5">{getContratoPreparacaoTitulo(contrato)}</h3>
          <p className="mt-3 text-xs font-semibold text-accent">{formatProposalMoney(contrato.valor)}</p>
          <p className="mt-2 break-words text-[11px] text-muted-foreground">Comercial: {contrato.responsavelComercialNome || "Não informado"}</p><p className="mt-1 break-words text-[11px] text-muted-foreground">Técnico: {contrato.responsavelNome || "Não definido"}</p>
          {contrato.status === "REJEITADO" && <p className="mt-2 text-xs text-destructive">Cliente reprovou o contrato</p>}
        </button>) : <p className="py-12 text-center text-xs text-muted-foreground">Nenhum contrato nesta coluna</p>}</div>
      </section>;
    })}
  </div></div>;
}
