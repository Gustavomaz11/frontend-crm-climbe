import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, X, ArrowLeft, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { formatarData } from "@/lib/datas";
import { baixarEmpresaComprovante, COMPROVANTES, useEmpresaComprovantes, useSolicitarEmpresaComprovantes, type EmpresaComprovante } from "@/services/useEmpresaComprovantes";

const ComprovantesModal = ({ empresaId, nome, onClose }: { empresaId: number; nome: string; onClose: () => void }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reduce = useReducedMotion();
  const [closing, setClosing] = useState(false);
  const [selected, setSelected] = useState<EmpresaComprovante | null>(null);
  const [pdf, setPdf] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const query = useEmpresaComprovantes(empresaId, true);
  const solicitar = useSolicitarEmpresaComprovantes(empresaId);

  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; if (focus?.isConnected) focus.focus({ preventScroll: true }); };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    let url = "";
    setError(""); setPdf(""); setLoading(true);
    baixarEmpresaComprovante(empresaId, selected.id, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      url = URL.createObjectURL(blob); setPdf(url);
    }).catch(() => { if (!controller.signal.aborted) setError("Não foi possível abrir o PDF. Tente novamente."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [empresaId, selected]);

  return createPortal(<motion.dialog ref={dialog} aria-labelledby={titleId} data-closing={closing} onCancel={e => { e.preventDefault(); setClosing(true); }} onClick={e => { if (e.target === e.currentTarget) setClosing(true); }}
    initial="closed" animate={closing ? "closed" : "open"} variants={{ closed: { opacity: 0, transform: reduce ? "scale(1)" : "scale(0.96)" }, open: { opacity: 1, transform: "scale(1)" } }} transition={{ duration: reduce ? .12 : .25, ease: [.23, 1, .32, 1] }} onAnimationComplete={state => { if (closing && state === "closed") onClose(); }}
    className="app-dialog m-auto h-[90dvh] w-[calc(100%_-_24px)] max-w-6xl overflow-hidden rounded-2xl border border-border/40 bg-card p-0 text-foreground backdrop:bg-background/80 backdrop:backdrop-blur-md">
    <div className="flex h-full flex-col"><header className="flex shrink-0 items-center gap-3 border-b border-border/30 p-4">
      {selected && <button type="button" aria-label="Voltar aos comprovantes" onClick={() => { setSelected(null); setPdf(""); setError(""); }} className="app-icon-button"><ArrowLeft className="h-4 w-4" /></button>}
      <div className="min-w-0 flex-1"><h2 id={titleId} className="text-sm font-semibold">{selected ? COMPROVANTES[selected.tipo] : "Comprovantes cadastrais"}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{nome}</p></div>
      <button type="button" aria-label="Fechar comprovantes" onClick={() => setClosing(true)} className="app-icon-button"><X className="h-4 w-4" /></button>
    </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        {selected ? <>{loading && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Carregando PDF...</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{pdf && <iframe src={pdf} title={`Comprovante ${COMPROVANTES[selected.tipo]}`} className="min-h-0 w-full flex-1 rounded-lg border border-border/30" />}</>
          : <div className="space-y-3"><p className="text-xs text-muted-foreground">O cartão CNPJ é emitido ao salvar o cadastro. Gere os demais comprovantes quando precisar. Esta lista acompanha o processamento automaticamente.</p>
            {query.isLoading && <p role="status">Carregando comprovantes...</p>}
            {query.isError && <div role="alert" className="text-sm text-destructive">Não foi possível consultar os comprovantes. <button type="button" className="underline" onClick={() => void query.refetch()}>Tentar novamente</button></div>}
            {query.data && Object.entries(COMPROVANTES).map(([tipo, nome]) => {
              const item = query.data.find(registro => registro.tipo === tipo);
              const status = item?.status || "NAO_SOLICITADO";
              return <div key={tipo} className="flex flex-col gap-3 rounded-xl border border-border/30 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{nome}</p><p className="mt-1 text-xs text-muted-foreground">{({ NAO_SOLICITADO: "Ainda não gerado", PENDENTE: "Aguardando emissão", PROCESSANDO: "Emitindo comprovante...", DISPONIVEL: "Disponível para visualização", ERRO: "Falha na emissão", INDISPONIVEL: "Comprovante não disponível" } as Record<string, string>)[status] || status}</p>{item?.geradoEm && <p className="mt-1 text-xs text-muted-foreground">Emitido em <time dateTime={item.geradoEm}>{formatarData(item.geradoEm)}</time></p>}{item?.mensagem && <p className="mt-1 text-xs text-muted-foreground">{item.mensagem}</p>}</div>
                {status === "NAO_SOLICITADO" && <button type="button" disabled={solicitar.isPending} onClick={() => solicitar.mutate({ tipo })} className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground disabled:opacity-50">Gerar {nome}</button>}
                {status === "DISPONIVEL" && item && <button type="button" onClick={() => setSelected(item)} className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground"><Eye className="h-4 w-4" />Visualizar {nome}</button>}
                {["ERRO", "INDISPONIVEL"].includes(status) && item && <button type="button" disabled={solicitar.isPending} onClick={() => solicitar.mutate({ id: item.id })} className="rounded border border-border/30 px-3 py-2 text-xs text-accent disabled:opacity-50">Tentar novamente {nome}</button>}
              </div>;
            })}
            {solicitar.isError && <p role="alert" className="text-xs text-destructive">Não foi possível solicitar a emissão. Tente novamente.</p>}
          </div>}
      </div>
    </div>
  </motion.dialog>, document.body);
};

export const EmpresaComprovantes = ({ empresaId, nome }: { empresaId: number; nome: string }) => {
  const [open, setOpen] = useState(false);
  return <><button type="button" onClick={() => setOpen(true)} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border/25 bg-card/40 text-xs text-foreground transition-colors hover:border-accent/30 hover:text-accent"><Eye className="h-4 w-4" />Visualizar comprovantes</button>{open && <ComprovantesModal empresaId={empresaId} nome={nome} onClose={() => setOpen(false)} />}</>;
};
