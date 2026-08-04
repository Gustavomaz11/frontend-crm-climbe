import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock3, FileUp, Loader2, Mail, MessageSquareText, RotateCcw, X, XCircle } from "lucide-react";
import {
  enviarNovaVersao, getRevisaoInternalPageBlob, getRevisaoInterna, reenviarRevisao,
  type RevisaoAnotacao, type RevisaoDocumento, type RevisaoTipo, type RevisaoVersao,
} from "@/services";

interface Props {
  open: boolean;
  tipo: RevisaoTipo;
  referenciaId: number | null;
  onClose: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function statusLabel(status: string) {
  return ({ AGUARDANDO_CLIENTE: "Aguardando cliente", AJUSTES_SOLICITADOS: "Ajustes solicitados", APROVADO: "Aprovado", REPROVADO: "Reprovado" } as Record<string, string>)[status] || status;
}

function AuthPage({ revisaoId, versao, pagina, anotacoes }: { revisaoId: number; versao: number; pagina: number; anotacoes: RevisaoAnotacao[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "500px" });
    observer.observe(host);
    return () => observer.disconnect();
  }, [revisaoId, versao, pagina]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    let blobUrl = "";
    setSrc(""); setError(false);
    getRevisaoInternalPageBlob(revisaoId, versao, pagina)
      .then((url) => { blobUrl = url; if (active) setSrc(url); else URL.revokeObjectURL(url); })
      .catch(() => active && setError(true));
    return () => { active = false; if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [revisaoId, versao, pagina, visible]);

  return <div ref={hostRef} className="space-y-1.5"><p className="px-1 text-[10px] text-muted-foreground">Página {pagina}</p><div className="relative overflow-hidden rounded-lg border border-border/25 bg-white shadow-lg">{src ? <img src={src} alt={`Página ${pagina}`} className="block w-full" loading="lazy" decoding="async" /> : <div className="flex aspect-[1/1.25] items-center justify-center">{error ? <AlertCircle className="h-5 w-5 text-destructive" /> : <Loader2 className="h-5 w-5 animate-spin text-accent" />}</div>}{anotacoes.map((item) => <div key={item.id} title={item.comentario} className="absolute border-2 border-foreground/30" style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%`, width: `${item.largura * 100}%`, height: `${item.altura * 100}%`, backgroundColor: `${item.cor}70` }} />)}</div></div>;
}

export function RevisaoDocumentoDialog({ open, tipo, referenciaId, onClose }: Props) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<RevisaoDocumento | null>(null);
  const [versaoNumero, setVersaoNumero] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open || !referenciaId) return;
    let active = true;
    setLoading(true); setError(""); setSuccess("");
    getRevisaoInterna(tipo, referenciaId)
      .then((result) => { if (!active) return; setData(result); setVersaoNumero(result.versaoAtual); })
      .catch((err) => active && setError(err instanceof Error ? err.message : "Não foi possível carregar a revisão"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, tipo, referenciaId]);

  const versao = useMemo(() => data?.versoes.find((item) => item.numero === versaoNumero), [data, versaoNumero]);

  async function novaVersao(file?: File) {
    if (!file || !data) return;
    try {
      setSending(true); setError(""); setSuccess("");
      const result = await enviarNovaVersao(data.id, file);
      setData(result); setVersaoNumero(result.versaoAtual);
      setSuccess("Nova versão enviada ao cliente por e-mail.");
      queryClient.invalidateQueries({ queryKey: [tipo === "PROPOSTA" ? "propostas" : "contratos"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar a nova versão");
    } finally { setSending(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function reenviar() {
    if (!data) return;
    try {
      setSending(true); setError(""); setSuccess("");
      const result = await reenviarRevisao(data.id);
      setData(result); setSuccess(`E-mail reenviado para ${result.destinatarioEmail}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reenviar o e-mail");
    } finally { setSending(false); }
  }

  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} /><motion.div className="relative z-10 flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-border/30 bg-card shadow-2xl" initial={{ scale: .96, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .96, y: 15 }}>
    <header className="flex items-center justify-between gap-4 border-b border-border/20 px-5 py-4"><div><h2 className="text-[16px] font-semibold">Revisão do cliente</h2><p className="mt-0.5 text-[11px] text-muted-foreground">{data ? `${data.empresaNome} · ${statusLabel(data.status)}` : tipo === "PROPOSTA" ? "Proposta" : "Contrato"}</p></div><button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/20 hover:text-foreground"><X className="h-4 w-4" /></button></header>
    {loading ? <div className="flex flex-1 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div> : !data ? <div className="flex flex-1 items-center justify-center p-6"><div className="max-w-md text-center"><AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" /><p className="text-[13px] font-semibold">Revisão indisponível</p><p className="mt-1 text-[11px] text-muted-foreground">{error}</p></div></div> : <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_370px]">
      <section className="min-h-0 overflow-y-auto bg-muted/10 p-4 sm:p-5"><div className="mx-auto max-w-4xl space-y-6">{versao && Array.from({ length: versao.totalPaginas }, (_, index) => <AuthPage key={`${versao.numero}-${index + 1}`} revisaoId={data.id} versao={versao.numero} pagina={index + 1} anotacoes={versao.anotacoes.filter((item) => item.pagina === index + 1)} />)}</div></section>
      <aside className="min-h-0 overflow-y-auto border-l border-border/20 p-4 space-y-4">
        <div className="rounded-xl border border-border/25 bg-background/40 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Destinatário</p><p className="mt-1 truncate text-[12px] font-semibold">{data.destinatarioEmail}</p></div><Mail className="h-4 w-4 text-accent" /></div><div className={`mt-3 rounded-md px-2 py-1.5 text-[10px] font-medium ${data.emailStatus === "ENVIADO" ? "bg-accent/10 text-accent" : data.emailStatus === "FALHOU" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{data.emailStatus === "ENVIADO" ? `E-mail enviado em ${formatDate(data.emailEnviadoEm)}` : data.emailStatus === "FALHOU" ? "Falha no envio. Verifique as credenciais SMTP e tente novamente." : "Envio de e-mail pendente"}</div><div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground"><Clock3 className="h-3 w-3" />Link válido até {formatDate(data.tokenExpiraEm)}</div><button onClick={reenviar} disabled={sending} className="mt-3 h-8 w-full rounded-lg border border-accent/30 text-[11px] font-semibold text-accent hover:bg-accent/5 disabled:opacity-50">Reenviar e-mail</button></div>
        <div><p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Histórico de versões</p><div className="flex flex-wrap gap-2">{data.versoes.map((item) => <button key={item.id} onClick={() => setVersaoNumero(item.numero)} className={`rounded-lg border px-3 py-2 text-left ${versaoNumero === item.numero ? "border-accent/50 bg-accent/5" : "border-border/25"}`}><p className="text-[11px] font-semibold">Versão {item.numero}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{statusLabel(item.resultado)}</p></button>)}</div></div>
        {versao && <><div className="rounded-xl border border-border/25 p-3"><div className="mb-3 flex items-center gap-2">{versao.resultado === "APROVADO" ? <CheckCircle2 className="h-4 w-4 text-accent" /> : versao.resultado === "REPROVADO" ? <XCircle className="h-4 w-4 text-destructive" /> : versao.resultado === "AJUSTES_SOLICITADOS" ? <RotateCcw className="h-4 w-4 text-primary" /> : <Clock3 className="h-4 w-4 text-primary" />}<div><p className="text-[12px] font-semibold">{statusLabel(versao.resultado)}</p><p className="text-[9px] text-muted-foreground">Enviada em {formatDate(versao.criadoEm)}</p></div></div>{versao.justificativa && <div className="rounded-lg bg-destructive/5 p-3 text-[11px] text-destructive"><strong>Justificativa:</strong> {versao.justificativa}</div>}{versao.comentarioGeral && <div className="mt-2 rounded-lg bg-muted/15 p-3 text-[11px]"><strong>Comentário geral:</strong> {versao.comentarioGeral}</div>}</div>
        <div className="rounded-xl border border-border/25 p-3"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-accent" /><p className="text-[12px] font-semibold">Comentários</p></div><span className="rounded-full bg-muted/20 px-2 py-0.5 text-[9px]">{versao.anotacoes.length}</span></div>{versao.anotacoes.length ? <div className="space-y-2">{versao.anotacoes.map((item, index) => <div key={item.id} className="rounded-lg border border-border/20 bg-background/40 p-3"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.cor }} /><p className="text-[10px] font-semibold">Marcação {index + 1} · página {item.pagina}</p></div><p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">{item.comentario}</p></div>)}</div> : <p className="text-[11px] text-muted-foreground">Nenhum comentário nesta versão.</p>}</div></>}
        <div className="rounded-xl border border-accent/25 bg-accent/5 p-3"><p className="text-[12px] font-semibold">Enviar arquivo ajustado</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Cria uma nova versão, preserva este histórico e envia um novo link ao cliente.</p><input ref={inputRef} type="file" accept=".pdf,.ppt,.pptx" className="hidden" onChange={(event) => novaVersao(event.target.files?.[0])} /><button onClick={() => inputRef.current?.click()} disabled={sending} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-accent text-[11px] font-semibold text-accent-foreground disabled:opacity-50">{sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}Enviar nova versão</button></div>
        {success && <p className="rounded-lg border border-accent/20 bg-accent/5 p-2.5 text-[11px] text-accent">{success}</p>}{error && <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-[11px] text-destructive">{error}</p>}
      </aside>
    </div>}
  </motion.div></motion.div>}</AnimatePresence>;
}
