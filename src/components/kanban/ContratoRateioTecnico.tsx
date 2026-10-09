import { useState } from "react";
import type { ContratoRateioTecnico } from "@/services/useContratoEquipe";
import { useContratoRateioTecnico } from "@/services/useContratoEquipe";
import { formatProposalMoney } from "@/services/proposalPayments";
import { getServiceLabel } from "@/services/commercialProposal";

const formatarMes = (competencia: string) => {
  const [ano, mes] = competencia.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(ano, mes - 1, 1)));
};

export const RateioTecnicoResumo = ({ rateio }: { rateio: ContratoRateioTecnico }) => <div className="space-y-3 text-xs">
  <p>Comissão técnica do mês: <strong className="text-accent">{formatProposalMoney(rateio.comissaoTecnicaTotal)}</strong></p>
  <p className="text-muted-foreground">Atuação em <strong>{formatarMes(rateio.competencia)}</strong> · Pagamento em <strong>{formatarMes(rateio.competenciaPagamento)}</strong></p>
  <p className="text-muted-foreground">Divisão em partes iguais entre {rateio.participantes.length} pessoa(s). Cada pessoa entra uma vez. Os centavos restantes são distribuídos entre os participantes.</p>
  <div className="flex flex-wrap gap-2">{rateio.servicos.map(s => <span key={s.servico} className="rounded border border-border/20 px-2 py-1 text-muted-foreground">{getServiceLabel(s.servico)} · {s.percentual}% · {formatProposalMoney(s.comissao)}</span>)}</div>
  <table className="w-full text-left"><thead className="text-muted-foreground"><tr><th className="py-2">Pessoa</th><th className="text-right">Valor do mês</th></tr></thead>
    <tbody>{rateio.participantes.map(p => <tr key={p.usuario.id} className="border-t border-border/15"><td className="py-2">{p.usuario.nomeCompleto}</td><td className="text-right font-medium">{formatProposalMoney(p.valor)}</td></tr>)}</tbody>
  </table>
</div>;
const mesAtual = () => {
  const parts = new Intl.DateTimeFormat("en", { year: "numeric", month: "2-digit", timeZone: "America/Sao_Paulo" }).formatToParts(new Date());
  return `${parts.find(p => p.type === "year")?.value}-${parts.find(p => p.type === "month")?.value}`;
};
export const ContratoRateioTecnicoPanel = ({ contratoId }: { contratoId: number }) => {
  const [competencia, setCompetencia] = useState(mesAtual);
  const { data, isLoading, error } = useContratoRateioTecnico(contratoId, competencia);
  return <details className="mt-5 rounded-lg border border-border/25 bg-card/40 p-4">
    <summary className="cursor-pointer text-sm font-semibold">Rateio técnico mensal</summary>
    <div className="mt-4 space-y-4"><label className="block text-xs">Mês de atuação<input aria-label="Mês do rateio técnico" type="month" value={competencia} onChange={e => setCompetencia(e.target.value)} className="ml-3 rounded border border-border/25 bg-background px-2 py-1" /></label>
      <p className="text-xs text-muted-foreground">Pessoas de apoio participam de cada mês entre a atribuição e a conclusão da tarefa. O pagamento é no mês seguinte. Cada pessoa conta uma vez por mês e o total da comissão técnica permanece o mesmo.</p>
      {isLoading ? <p className="text-xs">Carregando rateio...</p> : error ? <p role="alert" className="text-xs text-destructive">Não foi possível carregar o rateio técnico.</p> : data && <RateioTecnicoResumo rateio={data} />}
    </div>
  </details>;
};
