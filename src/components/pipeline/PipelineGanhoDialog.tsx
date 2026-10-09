import { useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { FormValidation } from "@/components/ui/form-validation";
import { UserSelect } from "@/components/users/UserSelect";
import { usePropostas, getPropostaFileNameFromUrl } from "@/services/usePropostas";
import { formatProposalMoney, getProposalServicesLabel } from "@/services/proposalPayments";
import type { PipelineNegocio } from "@/services/usePipelineVendas";
import type { Usuario } from "@/services/useUsuarios";

export function PipelineGanhoDialog({ negocio, usuarios, isProcessing, onClose, onConfirm }: {
  negocio: PipelineNegocio; usuarios: Usuario[]; isProcessing: boolean;
  onClose: () => void; onConfirm: (propostaId: number, tecnicoId: number) => void;
}) {
  const { data: propostas = [], isLoading, error } = usePropostas({ empresaId: negocio.empresaId || undefined, negocioId: negocio.id });
  const aprovadas = propostas.filter(p => p.status === "APROVADA" && (!p.revisaoStatus || p.revisaoStatus === "APROVADO"));
  const [propostaSelecionada, setPropostaSelecionada] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const propostaId = propostaSelecionada || (aprovadas.length === 1 ? String(aprovadas[0].idProposta) : "");
  const proposta = aprovadas.find(p => String(p.idProposta) === propostaId);
  return createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button type="button" aria-label="Cancelar venda ganha" disabled={isProcessing} className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
    <FormValidation as="section" role="dialog" aria-modal="true" aria-labelledby="ganho-title" className="relative w-full max-w-xl rounded-2xl border border-border/30 bg-card p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-3"><div><h2 id="ganho-title" className="font-semibold">Concluir venda de {negocio.nomeEmpresa}</h2><p className="mt-2 text-xs text-muted-foreground">A criação do contrato será adicionada em À fazer na aba Contratos. O técnico ficará registrado como responsável futuro.</p></div><button disabled={isProcessing} type="button" aria-label="Fechar" onClick={onClose}><X className="h-4 w-4" /></button></div>
      <label className="mt-5 block text-xs font-medium">Proposta aprovada pelo cliente *<select required aria-label="Proposta aprovada pelo cliente" disabled={isProcessing || isLoading} value={propostaId} onChange={e => setPropostaSelecionada(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border/30 bg-background px-3 text-xs"><option value="">Selecione a proposta aprovada</option>{aprovadas.map(p => <option key={p.idProposta} value={p.idProposta}>{getPropostaFileNameFromUrl(p.url)}</option>)}</select></label>
      {isLoading ? <p className="mt-2 text-xs text-muted-foreground">Carregando propostas...</p> : error ? <p role="alert" className="mt-2 text-xs text-destructive">Não foi possível carregar as propostas. Feche e tente novamente.</p> : !aprovadas.length ? <p role="alert" className="mt-2 text-xs text-destructive">Este negócio precisa de uma proposta aprovada pelo cliente para concluir a venda.</p> : null}
      {proposta && <div className="mt-3 rounded-lg bg-accent/10 p-3 text-xs"><p>{getProposalServicesLabel(proposta)}</p><p className="mt-1 font-semibold">{formatProposalMoney(proposta.valuation || 0)}</p></div>}
      <div className="mt-5 space-y-2"><p className="text-xs font-medium" id="tecnico-label">Responsável técnico pelo contrato *</p><UserSelect required users={usuarios.filter(u => !u.situacao || u.situacao.toUpperCase() === "ATIVO")} value={tecnicoId} onValueChange={setTecnicoId} ariaLabel="Responsável técnico pelo contrato" disabled={isProcessing} placeholder="Selecione o responsável técnico" /></div>
      <div className="mt-6 flex justify-end gap-2"><button type="button" disabled={isProcessing} onClick={onClose} className="rounded-lg border border-border/30 px-4 py-2 text-xs">Cancelar</button><button type="button" data-validate-submit disabled={isProcessing || isLoading || !!error || !aprovadas.length} onClick={() => onConfirm(Number(propostaId), Number(tecnicoId))} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50"><Check className="h-4 w-4" />{isProcessing ? "Salvando..." : "Marcar como ganho"}</button></div>
    </FormValidation>
  </div>, document.body);
}
