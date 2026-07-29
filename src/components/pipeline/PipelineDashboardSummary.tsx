import { AlertTriangle, CircleDollarSign, Clock3, Target, Trophy, XCircle } from "lucide-react";
import type { PipelineDashboard } from "@/services/usePipelineDashboard";

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0);

export const PipelineDashboardSummary = ({ summary }: { summary: PipelineDashboard["resumo"] }) => {
  const cards = [
    ["Negócios abertos", summary.negociosAbertos, Target, "text-sky-500"],
    ["Negócios ganhos", summary.negociosGanhos, Trophy, "text-emerald-500"],
    ["Negócios perdidos", summary.negociosPerdidos, XCircle, "text-red-500"],
    ["Taxa de conversão", `${summary.taxaConversao}%`, Target, "text-accent"],
    ["Valor das propostas", money(summary.valorTotalPropostas), CircleDollarSign, "text-violet-500"],
    ["Contratos fechados", money(summary.valorContratosFechados), CircleDollarSign, "text-emerald-500"],
    ["Tempo médio fechamento", `${summary.tempoMedioFechamentoDias} dias`, Clock3, "text-amber-500"],
    ["Precisam de atenção", summary.negociosEstagnados + summary.tarefasAtrasadas, AlertTriangle, "text-orange-500"],
  ] as const;
  return <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, Icon, color]) => <article key={label} className="rounded-xl border border-border/25 bg-card/45 p-4"><div className="flex items-center justify-between"><p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p><Icon className={`h-4 w-4 ${color}`} /></div><p className="mt-2 text-xl font-bold">{value}</p></article>)}</div>;
};
