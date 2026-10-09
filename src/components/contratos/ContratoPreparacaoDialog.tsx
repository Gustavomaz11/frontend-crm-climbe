import { useEffect, useState } from "react";
import { Download, FileUp, Mail, Save, X } from "lucide-react";
import { toast } from "sonner";
import { TaskDialogShell } from "@/components/tasks/TaskDialogShell";
import { FormValidation } from "@/components/ui/form-validation";
import { PropostaFinancialSummary } from "@/components/propostas/PropostaFinancialSummary";
import { getContratoDownloadUrl, useEnviarContratoCliente, useMoveContratoPreparacao, type Contrato, type ContratoPreparacaoEtapa } from "@/services/useContratos";
import { getPropostaDownloadUrl, type PropostaApi } from "@/services/usePropostas";
import { CONTRATO_PREPARACAO_COLUNAS, getContratoPreparacaoEtapa, getContratoPreparacaoTitulo } from "@/services/contratoPreparacao";
import { formatProposalMoney } from "@/services/proposalPayments";

export function ContratoPreparacaoDialog({ contrato, proposta, canEdit, onClose, onReview, onManage }: {
  contrato: Contrato; proposta?: PropostaApi; canEdit: boolean;
  onClose: () => void; onReview: () => void; onManage: () => void;
}) {
  const current = getContratoPreparacaoEtapa(contrato);
  const [etapa, setEtapa] = useState<ContratoPreparacaoEtapa>(current);
  const [file, setFile] = useState<File | null>(null);
  const [emailFailed, setEmailFailed] = useState(false);
  const move = useMoveContratoPreparacao();
  const send = useEnviarContratoCliente();
  const busy = move.isPending || send.isPending;
  useEffect(() => setEtapa(current), [current]);
  const openDocument = async (proposal: boolean) => {
    const windowRef = window.open("", "_blank");
    if (windowRef) windowRef.opener = null;
    try {
      const url = proposal ? await getPropostaDownloadUrl(contrato.propostaId!) : await getContratoDownloadUrl(contrato.id);
      if (windowRef) windowRef.location.href = url;
    } catch (error) { windowRef?.close(); toast.error(error instanceof Error ? error.message : "Não foi possível abrir o documento"); }
  };
  const upload = async () => {
    if (!file) return;
    try {
      const review = await send.mutateAsync({ id: contrato.id, file });
      setFile(null);
      setEmailFailed(review.emailStatus !== "ENVIADO");
      if (review.emailStatus === "ENVIADO") toast.success("Contrato enviado ao cliente. O comercial foi notificado.");
      else toast.error("O contrato foi salvo, mas o e-mail não foi enviado. Abra Revisão do cliente para reenviar.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível enviar o contrato"); }
  };
  const save = async () => {
    try { await move.mutateAsync({ id: contrato.id, etapa }); toast.success("Etapa do contrato atualizada"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar a etapa"); }
  };
  return <TaskDialogShell label={getContratoPreparacaoTitulo(contrato)} onClose={onClose} closeDisabled={busy}>
    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border/20 p-5"><div><h2 className="break-words text-base font-semibold">{getContratoPreparacaoTitulo(contrato)}</h2><p className="mt-1 text-xs text-muted-foreground">CT-{contrato.id} · Preparação e envio do contrato ao cliente</p></div><button disabled={busy} type="button" aria-label="Fechar contrato" onClick={onClose}><X className="h-5 w-5" /></button></header>
    <div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="grid items-start gap-5 lg:grid-cols-2">
      <section className="min-w-0 space-y-5">
        <div className="rounded-xl border border-border/25 bg-background/40 p-4"><h3 className="text-sm font-semibold">Informações da venda</h3><dl className="mt-4 space-y-4 text-xs"><div><dt className="text-muted-foreground">Empresa</dt><dd className="mt-1 font-medium">{contrato.empresaNome}</dd></div><div><dt className="text-muted-foreground">Responsável comercial</dt><dd className="mt-1 font-medium">{contrato.responsavelComercialNome || "Não informado"}</dd></div><div><dt className="text-muted-foreground">Responsável técnico selecionado pelo comercial</dt><dd className="mt-1 font-medium">{contrato.responsavelNome || "Não definido"}</dd></div><div><dt className="text-muted-foreground">Valor total da proposta</dt><dd className="mt-1 text-lg font-semibold text-accent">{formatProposalMoney(proposta?.valuation ?? contrato.valor)}</dd></div></dl><p className="mt-4 text-xs text-muted-foreground">O técnico será responsável pela execução após a aprovação do contrato.</p></div>
        <div className="rounded-xl border border-border/25 p-4"><h3 className="text-sm font-semibold">Proposta aprovada pelo cliente</h3><p className="my-3 break-words text-xs text-muted-foreground">{contrato.propostaTitulo || "Sem proposta vinculada"}</p>{contrato.propostaId && <button type="button" onClick={() => void openDocument(true)} className="flex items-center gap-2 rounded-lg border border-accent/30 px-3 py-2 text-xs text-accent"><Download className="h-4 w-4" />Visualizar ou baixar proposta</button>}</div>
        <label className="block text-xs font-medium">Coluna do contrato<select aria-label="Coluna do contrato" disabled={!canEdit || busy || contrato.status === "APROVADO"} value={etapa} onChange={e => setEtapa(e.target.value as ContratoPreparacaoEtapa)} className="mt-2 h-11 w-full rounded-lg border border-border/30 bg-background px-3 text-xs">{CONTRATO_PREPARACAO_COLUNAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
        <button type="button" onClick={onManage} className="text-xs text-accent underline underline-offset-4">Gerenciar responsáveis, aprovação e histórico</button>
      </section>
      <section className="min-w-0 space-y-5">
        <div className="space-y-4 rounded-xl border border-border/25 p-4"><h3 className="text-sm font-semibold">Valores dos serviços aprovados</h3><PropostaFinancialSummary servicos={proposta?.servicos?.length ? proposta.servicos : contrato.servicos?.length ? contrato.servicos : contrato.servico ? [{ servico: contrato.servico, valor: contrato.valor }] : []} recebimentos={proposta?.recebimentos} /></div>
        <div className="rounded-xl border border-border/25 p-4"><h3 className="mb-3 text-sm font-semibold">Contrato para o cliente</h3>{contrato.urlPdf ? <div className="space-y-3"><p className="break-words text-xs text-muted-foreground">{contrato.titulo}</p><button type="button" onClick={() => void openDocument(false)} className="flex items-center gap-2 text-xs text-accent"><Download className="h-4 w-4" />Visualizar ou baixar contrato</button><button type="button" onClick={onReview} className="flex items-center gap-2 rounded-lg border border-accent/30 px-3 py-2 text-xs text-accent"><Mail className="h-4 w-4" />Revisão do cliente, versões e reenvio</button>{emailFailed && <p role="alert" className="text-xs text-destructive">O e-mail não foi enviado. Use o reenvio na revisão do cliente.</p>}</div> : canEdit ? <FormValidation className="space-y-3"><p className="text-xs text-muted-foreground">Anexe o contrato em PDF. O cliente receberá o link por e-mail para revisar e assinar; o comercial será avisado quando o envio for realizado.</p><label className="relative flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/40 p-4 text-xs"><FileUp className="h-4 w-4 text-accent" />Anexar contrato *<input required data-required-message="Anexe o contrato em PDF para enviar ao cliente." data-validation-message={file && !file.name.toLowerCase().endsWith(".pdf") ? "Selecione um arquivo PDF para o contrato." : undefined} aria-label="Contrato em PDF" disabled={busy} type="file" accept=".pdf" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={e => setFile(e.target.files?.[0] || null)} /></label>{file && <p className="break-all rounded-lg bg-background/50 p-3 text-xs">{file.name}</p>}<button type="button" data-validate-submit onClick={() => void upload()} disabled={busy} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50"><Mail className="h-4 w-4" />{send.isPending ? "Enviando..." : "Enviar contrato ao cliente"}</button></FormValidation> : <p className="text-xs text-muted-foreground">O contrato ainda não foi anexado.</p>}</div>
      </section>
    </div></div>
    <footer className="flex shrink-0 justify-end gap-3 border-t border-border/20 p-4"><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-border/25 px-4 py-2 text-xs">Fechar</button>{canEdit && <button type="button" disabled={busy || etapa === current} onClick={() => void save()} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50"><Save className="h-4 w-4" />{move.isPending ? "Salvando..." : "Salvar alterações"}</button>}</footer>
  </TaskDialogShell>;
}
