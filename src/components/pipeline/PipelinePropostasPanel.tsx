import { useState } from "react";
import { ExternalLink, FileText, Loader2, MessageSquareWarning, Plus } from "lucide-react";
import { RevisaoDocumentoDialog } from "@/components/revisoes/RevisaoDocumentoDialog";
import { getServiceLabel } from "@/services/commercialProposal";
import {
  getPropostaDownloadUrl,
  getPropostaFileNameFromUrl,
  usePropostas,
  type PropostaStatus,
} from "@/services/usePropostas";
import type { PipelineNegocio } from "@/services/usePipelineVendas";

interface PipelinePropostasPanelProps {
  negocio: PipelineNegocio;
  canCreate: boolean;
  onCreate: () => void;
}

const statusClasses: Record<PropostaStatus, string> = {
  PENDENTE: "border-amber-500/25 bg-amber-500/10 text-amber-500",
  APROVADA: "border-emerald-500/25 bg-emerald-500/10 text-emerald-500",
  REJEITADA: "border-red-500/25 bg-red-500/10 text-red-500",
};

const formatCurrency = (value?: number | null) => {
  if (value == null) return "Valor não informado";
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatDate = (value?: string | null) => value
  ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR")
  : "Data não informada";

export const PipelinePropostasPanel = ({
  negocio,
  canCreate,
  onCreate,
}: PipelinePropostasPanelProps) => {
  const empresaId = negocio.empresaId ?? undefined;
  const { data: propostas = [], isLoading, error } = usePropostas(
    { empresaId },
    Boolean(empresaId),
  );
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [reviewProposalId, setReviewProposalId] = useState<number | null>(null);
  const [openError, setOpenError] = useState("");
  const hasPendingAdjustments = propostas.some((proposta) => (
    proposta.negocioId === negocio.id && proposta.revisaoStatus === "AJUSTES_SOLICITADOS"
  ));

  const openProposal = async (id: number) => {
    setOpeningId(id);
    setOpenError("");
    try {
      const url = await getPropostaDownloadUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (proposalError) {
      setOpenError(proposalError instanceof Error ? proposalError.message : "Não foi possível abrir a proposta");
    } finally {
      setOpeningId(null);
    }
  };

  if (!empresaId) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-[12px] text-amber-500">
        Cadastre ou vincule uma empresa a este negócio antes de criar uma proposta.
      </div>
    );
  }

  return (
    <>
      <section>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold">Propostas do cliente</h3>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Consulte todas as propostas da empresa e identifique as vinculadas a este negócio.
          </p>
        </div>
        {canCreate && (
          <button type="button" onClick={onCreate} className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-[11px] font-semibold text-accent-foreground">
            <Plus className="h-3.5 w-3.5" />Nova proposta
          </button>
        )}
      </div>

      {openError && <p className="mb-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">{openError}</p>}
      {hasPendingAdjustments && (
        <div className="mb-3 flex items-start gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-amber-500">
          <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold">O cliente analisou a proposta e solicitou ajustes</p>
            <p className="mt-0.5 text-[10px] text-amber-500/85">Abra os ajustes para consultar as marcações e comentários antes de enviar uma nova versão.</p>
          </div>
        </div>
      )}
      {isLoading && <div className="py-12 text-center text-[11px] text-muted-foreground">Carregando propostas...</div>}
      {error && <div className="py-12 text-center text-[11px] text-destructive">Não foi possível carregar as propostas.</div>}
      {!isLoading && !error && propostas.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/30 py-12 text-center">
          <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-[11px] text-muted-foreground">Nenhuma proposta criada para esta empresa.</p>
        </div>
      )}
      {!isLoading && !error && propostas.length > 0 && (
        <div className="space-y-2">
          {propostas.map((proposta) => {
            const belongsToBusiness = proposta.negocioId === negocio.id;
            const needsReview = belongsToBusiness && proposta.revisaoStatus === "AJUSTES_SOLICITADOS";
            const hasReview = Boolean(proposta.revisaoStatus);
            return (
              <article key={proposta.idProposta} className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${needsReview ? "border-amber-500/45 bg-amber-500/10" : belongsToBusiness ? "border-accent/35 bg-accent/5" : "border-border/25 bg-background/35"}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${needsReview ? "bg-amber-500/15 text-amber-500" : "bg-accent/10 text-accent"}`}>{needsReview ? <MessageSquareWarning className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[12px] font-semibold">{getPropostaFileNameFromUrl(proposta.url)}</p>
                    {belongsToBusiness && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-accent">Deste negócio</span>}
                    {needsReview && <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-amber-500">Ajustes solicitados</span>}
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{getServiceLabel(proposta.servico)} · {formatCurrency(proposta.valuation)} · {formatDate(proposta.dataCriacao)}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${statusClasses[proposta.status]}`}>{proposta.status}</span>
                {hasReview && (
                  <button type="button" onClick={() => setReviewProposalId(proposta.idProposta)} className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-semibold ${needsReview ? "border-amber-500/35 bg-amber-500/10 text-amber-500 hover:bg-amber-500/15" : "border-accent/30 bg-accent/5 text-accent hover:bg-accent/10"}`}>
                    <MessageSquareWarning className="h-3 w-3" />{needsReview ? "Ver ajustes" : "Ver revisão"}
                  </button>
                )}
                <button type="button" onClick={() => void openProposal(proposta.idProposta)} disabled={openingId === proposta.idProposta || !proposta.url} className="flex h-8 items-center gap-1.5 rounded-lg border border-border/30 px-2.5 text-[10px] text-muted-foreground hover:border-accent/35 hover:text-accent disabled:opacity-40">
                  {openingId === proposta.idProposta ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}Abrir
                </button>
              </article>
            );
          })}
        </div>
      )}
      </section>
      {reviewProposalId !== null && (
        <RevisaoDocumentoDialog
          open
          tipo="PROPOSTA"
          referenciaId={reviewProposalId}
          onClose={() => setReviewProposalId(null)}
        />
      )}
    </>
  );
};
