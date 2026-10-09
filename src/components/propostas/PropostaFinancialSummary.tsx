import { getServiceLabel } from "@/services/commercialProposal";
import { formatProposalMoney } from "@/services/proposalPayments";
import type { PropostaRecebimento, PropostaServicoConfig } from "@/services/usePropostas";

export const PropostaFinancialSummary = ({ servicos = [], recebimentos = [] }: {
  servicos?: PropostaServicoConfig[];
  recebimentos?: PropostaRecebimento[];
}) => (
  <>
    {servicos.length > 0 && <div className="space-y-2">
      <h3 className="text-[11px] font-semibold">Valores e comissões por serviço</h3>
      {servicos.map((item) => <div key={item.servico} className="rounded-lg border border-border/25 p-3 text-[11px]">
        <p className="font-semibold">{getServiceLabel(item.servico)} · {formatProposalMoney(item.valor)}</p>
        <p className="mt-1 text-muted-foreground">Técnica: {item.comissaoTecnicoPercentual ?? 30}% · {formatProposalMoney(item.valor * (item.comissaoTecnicoPercentual ?? 30) / 100)}</p>
        <p className="text-muted-foreground">Comercial: {item.comissaoComercialPercentual ?? 20}% · {formatProposalMoney(item.valor * (item.comissaoComercialPercentual ?? 20) / 100)}</p>
      </div>)}
    </div>}
    {recebimentos.length > 0 && <div>
      <h3 className="mb-2 text-[11px] font-semibold">Plano de recebimentos</h3>
      <div className="grid gap-2 sm:grid-cols-2">{recebimentos.map((item) => <div key={item.numero} className="min-w-0 rounded-lg border border-border/25 p-2 text-[11px]">
        <p className="font-semibold">{item.numero}º · {formatProposalMoney(item.valor)}</p>
        {item.servicos?.map((service) => <p key={service.servico} className="mt-1 flex flex-wrap justify-between gap-1 text-muted-foreground"><span>{getServiceLabel(service.servico)}</span><span>{formatProposalMoney(service.valor)}</span></p>)}
      </div>)}</div>
    </div>}
  </>
);
