import { Activity, CircleDollarSign, MessageSquareText, RefreshCw, Trophy, UserRound } from "lucide-react";
import { usePipelineHistorico } from "@/services/usePipelineAtividades";

interface PipelineHistoricoPanelProps {
  negocioId: number;
  canView: boolean;
}

const iconForEvent = (type: string) => {
  if (type === "ALTERACAO_RESPONSAVEL") return UserRound;
  if (type === "ALTERACAO_VALOR_PROPOSTA") return CircleDollarSign;
  if (type === "COMENTARIO_ADICIONADO") return MessageSquareText;
  if (["FECHAMENTO", "CONVERSAO_CONTRATO"].includes(type)) return Trophy;
  if (type === "REATIVACAO") return RefreshCw;
  return Activity;
};

const formatDateTime = (value: string) => new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
}).format(new Date(value));

export const PipelineHistoricoPanel = ({ negocioId, canView }: PipelineHistoricoPanelProps) => {
  const { data: history = [], isLoading } = usePipelineHistorico(negocioId, canView);

  if (!canView) return <div className="rounded-xl border border-border/25 bg-muted/10 p-8 text-center text-[11px] text-muted-foreground">Você não possui permissão para visualizar o histórico comercial.</div>;

  return (
    <div>
      <div><h3 className="text-[13px] font-semibold">Histórico completo</h3><p className="mt-0.5 text-[10px] text-muted-foreground/50">Linha do tempo auditável de tudo o que aconteceu.</p></div>
      {isLoading ? <p className="py-10 text-center text-[11px] text-muted-foreground">Carregando histórico...</p> : <div className="mt-5 space-y-0">{history.map((event, index) => { const Icon = iconForEvent(event.tipo); return <article key={event.id} className="relative flex gap-3 pb-5"><div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/30 bg-card text-accent"><Icon className="h-3.5 w-3.5" /></div>{index < history.length - 1 && <div className="absolute bottom-0 left-[15px] top-8 w-px bg-border/25" />}<div className="min-w-0 pt-0.5"><p className="text-[11px] font-medium">{event.descricao}</p><p className="mt-1 text-[9px] text-muted-foreground/50">{event.usuarioNome} · {formatDateTime(event.criadoEm)}</p></div></article>; })}{history.length === 0 && <p className="py-10 text-center text-[10px] text-muted-foreground/45">Nenhum evento registrado.</p>}</div>}
    </div>
  );
};
