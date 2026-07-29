import { useEffect, useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle, Check, CheckCircle2, Clock3, FileText, Highlighter,
  Loader2, MessageSquareText, RotateCcw, Send, Trash2, XCircle,
} from "lucide-react";
import ClimbLogo from "@/components/login/ClimbLogo";
import {
  aprovarRevisaoPublica,
  enviarRevisaoPublica,
  getRevisaoPublicPageUrl,
  getRevisaoPublica,
  reprovarRevisaoPublica,
  type RevisaoAnotacao,
  type RevisaoDocumento,
} from "@/services";

const CORES = ["#FACC15", "#FB923C", "#38BDF8", "#A78BFA", "#4ADE80"];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

interface ReviewPageProps {
  pagina: number;
  token: string;
  anotacoes: RevisaoAnotacao[];
  selecionada?: string;
  disabled: boolean;
  cor: string;
  onSelecionar: (id: string) => void;
  onCriar: (anotacao: RevisaoAnotacao) => void;
}

function ReviewPage({ pagina, token, anotacoes, selecionada, disabled, cor, onSelecionar, onCriar }: ReviewPageProps) {
  const [inicio, setInicio] = useState<{ x: number; y: number } | null>(null);
  const [rascunho, setRascunho] = useState<{ x: number; y: number; largura: number; altura: number } | null>(null);

  function ponto(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }

  function atualizar(event: ReactPointerEvent<HTMLDivElement>) {
    if (!inicio) return;
    const fim = ponto(event);
    setRascunho({
      x: Math.min(inicio.x, fim.x), y: Math.min(inicio.y, fim.y),
      largura: Math.abs(fim.x - inicio.x), altura: Math.abs(fim.y - inicio.y),
    });
  }

  function finalizar(event: ReactPointerEvent<HTMLDivElement>) {
    if (!inicio) return;
    atualizar(event);
    const fim = ponto(event);
    const next = {
      x: Math.min(inicio.x, fim.x), y: Math.min(inicio.y, fim.y),
      largura: Math.abs(fim.x - inicio.x), altura: Math.abs(fim.y - inicio.y),
    };
    setInicio(null);
    setRascunho(null);
    if (next.largura < 0.008 || next.altura < 0.008) return;
    onCriar({ ...next, pagina, cor, comentario: "", localId: crypto.randomUUID() });
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground/60">
        <span>Página {pagina}</span><span>Arraste para marcar</span>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-border/30 bg-white shadow-xl">
        <img src={getRevisaoPublicPageUrl(token, pagina)} alt={`Página ${pagina}`} className="block w-full select-none" draggable={false} loading="lazy" decoding="async" />
        <div
          className={`absolute inset-0 ${disabled ? "cursor-default" : "cursor-crosshair touch-none"}`}
          onPointerDown={(event) => {
            if (disabled) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            const start = ponto(event);
            setInicio(start);
            setRascunho({ ...start, largura: 0, altura: 0 });
          }}
          onPointerMove={atualizar}
          onPointerUp={finalizar}
          onPointerCancel={() => { setInicio(null); setRascunho(null); }}
        >
          {anotacoes.map((item) => {
            const id = item.localId || String(item.id);
            return (
              <button
                type="button"
                key={id}
                aria-label={`Marcação: ${item.comentario || "sem comentário"}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => { event.stopPropagation(); onSelecionar(id); }}
                className={`absolute border-2 transition-all ${selecionada === id ? "border-accent shadow-[0_0_0_3px_hsl(var(--accent)/.22)]" : "border-transparent hover:border-foreground/30"}`}
                style={{
                  left: `${item.x * 100}%`, top: `${item.y * 100}%`,
                  width: `${item.largura * 100}%`, height: `${item.altura * 100}%`,
                  backgroundColor: `${item.cor}70`,
                }}
              />
            );
          })}
          {rascunho && (
            <div className="absolute border-2 border-accent" style={{
              left: `${rascunho.x * 100}%`, top: `${rascunho.y * 100}%`,
              width: `${rascunho.largura * 100}%`, height: `${rascunho.altura * 100}%`,
              backgroundColor: `${cor}60`,
            }} />
          )}
        </div>
      </div>
    </section>
  );
}

const RevisaoDocumentoPublica = () => {
  const { token = "" } = useParams();
  const [info, setInfo] = useState<RevisaoDocumento | null>(null);
  const [anotacoes, setAnotacoes] = useState<RevisaoAnotacao[]>([]);
  const [selecionada, setSelecionada] = useState<string>();
  const [cor, setCor] = useState(CORES[0]);
  const [comentarioGeral, setComentarioGeral] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [reprovando, setReprovando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const versaoAtual = useMemo(
    () => info?.versoes.find((item) => item.numero === info.versaoAtual),
    [info],
  );
  const podeResponder = info?.status === "AGUARDANDO_CLIENTE";
  const anotacaoSelecionada = anotacoes.find((item) => (item.localId || String(item.id)) === selecionada);

  useEffect(() => {
    let active = true;
    getRevisaoPublica(token)
      .then((data) => {
        if (!active) return;
        setInfo(data);
        const atual = data.versoes.find((item) => item.numero === data.versaoAtual);
        setAnotacoes((atual?.anotacoes || []).map((item) => ({ ...item, localId: String(item.id) })));
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "Link inválido ou expirado"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  function adicionar(item: RevisaoAnotacao) {
    setAnotacoes((current) => [...current, item]);
    setSelecionada(item.localId);
    window.setTimeout(() => document.getElementById(`comentario-${item.localId}`)?.focus(), 50);
  }

  function alterarComentario(valor: string) {
    setAnotacoes((current) => current.map((item) =>
      (item.localId || String(item.id)) === selecionada ? { ...item, comentario: valor } : item,
    ));
  }

  function removerSelecionada() {
    setAnotacoes((current) => current.filter((item) => (item.localId || String(item.id)) !== selecionada));
    setSelecionada(undefined);
  }

  async function executar(action: () => Promise<RevisaoDocumento>) {
    try {
      setSending(true); setError("");
      const result = await action();
      setInfo(result);
      setReprovando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar sua resposta");
    } finally {
      setSending(false);
    }
  }

  async function enviarRevisao() {
    if (!anotacoes.length) {
      setError("Faça ao menos uma marcação no documento para solicitar a revisão.");
      return;
    }
    if (anotacoes.some((item) => !item.comentario.trim())) {
      setError("Escreva um comentário em cada marcação antes de enviar.");
      return;
    }
    await executar(() => enviarRevisaoPublica(token, anotacoes, comentarioGeral));
  }

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-7 h-7 text-accent animate-spin" /></div>;

  if (!info) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="max-w-md rounded-2xl border border-destructive/20 bg-card p-8 text-center shadow-xl">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <h1 className="text-lg font-semibold">Não foi possível abrir a revisão</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error || "O link é inválido ou expirou."}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/25 bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <ClimbLogo className="h-[18px] shrink-0 text-foreground" />
            <div className="h-6 w-px bg-border/30" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">Revisão de {info.tipo === "PROPOSTA" ? "proposta" : "contrato"}</p>
              <p className="truncate text-[11px] text-muted-foreground/55">{info.empresaNome} · versão {info.versaoAtual}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary sm:flex">
            <Clock3 className="h-3.5 w-3.5" /> Link válido até {formatDate(info.tokenExpiraEm)}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_370px]">
        <div className="min-w-0 rounded-2xl border border-border/25 bg-muted/10 p-3 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10"><FileText className="h-4 w-4 text-accent" /></div>
              <div className="min-w-0"><p className="truncate text-[13px] font-semibold">{info.nomeArquivo}</p><p className="text-[11px] text-muted-foreground/50">{info.totalPaginas} página(s)</p></div>
            </div>
            {podeResponder && <div className="flex items-center gap-1.5 rounded-lg border border-border/25 bg-card px-2 py-1.5"><Highlighter className="h-3.5 w-3.5 text-accent" />{CORES.map((item) => <button key={item} onClick={() => setCor(item)} className={`h-5 w-5 rounded-full border-2 ${cor === item ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: item }} aria-label={`Usar cor ${item}`} />)}</div>}
          </div>
          <div className="mx-auto max-w-5xl space-y-7">
            {Array.from({ length: info.totalPaginas }, (_, index) => (
              <ReviewPage key={index + 1} pagina={index + 1} token={token} anotacoes={anotacoes.filter((item) => item.pagina === index + 1)} selecionada={selecionada} disabled={!podeResponder} cor={cor} onSelecionar={setSelecionada} onCriar={adicionar} />
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[78px] lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto lg:pr-1">
          {info.status !== "AGUARDANDO_CLIENTE" && (
            <div className={`rounded-xl border p-4 ${info.status === "APROVADO" ? "border-accent/25 bg-accent/10" : info.status === "REPROVADO" ? "border-destructive/25 bg-destructive/10" : "border-primary/25 bg-primary/10"}`}>
              {info.status === "APROVADO" ? <CheckCircle2 className="mb-2 h-6 w-6 text-accent" /> : info.status === "REPROVADO" ? <XCircle className="mb-2 h-6 w-6 text-destructive" /> : <RotateCcw className="mb-2 h-6 w-6 text-primary" />}
              <p className="text-[14px] font-semibold">{info.status === "APROVADO" ? "Documento aprovado" : info.status === "REPROVADO" ? "Documento reprovado" : "Revisão enviada"}</p>
              <p className="mt-1 text-[11px] text-muted-foreground/65">Sua resposta foi registrada. A equipe Climbe foi notificada.</p>
              {info.justificativa && <p className="mt-3 rounded-lg bg-background/50 p-3 text-[12px]">{info.justificativa}</p>}
            </div>
          )}

          <div className="rounded-xl border border-border/25 bg-card p-4">
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-accent" /><h2 className="text-[13px] font-semibold">Marcações e comentários</h2></div><span className="rounded-full bg-muted/25 px-2 py-0.5 text-[10px]">{anotacoes.length}</span></div>
            {!anotacoes.length ? <p className="rounded-lg border border-dashed border-border/30 p-5 text-center text-[11px] text-muted-foreground/50">{podeResponder ? "Arraste sobre um trecho do documento para adicionar uma marcação." : "Nenhuma marcação nesta versão."}</p> : (
              <div className="space-y-2">
                {anotacoes.map((item, index) => {
                  const id = item.localId || String(item.id);
                  const active = selecionada === id;
                  return <button key={id} type="button" onClick={() => setSelecionada(id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${active ? "border-accent/50 bg-accent/5" : "border-border/20 bg-background/40 hover:border-border/40"}`}><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.cor }} /><span className="text-[11px] font-semibold">Marcação {index + 1} · página {item.pagina}</span></div><p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/60">{item.comentario || "Comentário pendente"}</p></button>;
                })}
              </div>
            )}

            {anotacaoSelecionada && podeResponder && (
              <div className="mt-3 rounded-lg border border-accent/25 bg-accent/5 p-3">
                <label className="mb-1.5 block text-[11px] font-semibold">Comentário da marcação</label>
                <textarea id={`comentario-${anotacaoSelecionada.localId}`} value={anotacaoSelecionada.comentario} onChange={(event) => alterarComentario(event.target.value)} rows={4} placeholder="Explique o ajuste desejado..." className="w-full resize-none rounded-lg border border-border/30 bg-background px-3 py-2 text-[12px] outline-none focus:border-accent/60" />
                <button onClick={removerSelecionada} className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-destructive"><Trash2 className="h-3.5 w-3.5" />Remover marcação</button>
              </div>
            )}
          </div>

          {podeResponder && (
            <div className="rounded-xl border border-border/25 bg-card p-4 space-y-3">
              <div><label className="mb-1.5 block text-[11px] font-semibold">Comentário geral <span className="font-normal text-muted-foreground/45">(opcional)</span></label><textarea value={comentarioGeral} onChange={(event) => setComentarioGeral(event.target.value)} rows={3} className="w-full resize-none rounded-lg border border-border/30 bg-background px-3 py-2 text-[12px] outline-none focus:border-accent/60" placeholder="Observações sobre o documento..." /></div>
              {error && <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-[11px] text-destructive">{error}</p>}
              <button onClick={enviarRevisao} disabled={sending} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[12px] font-semibold text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" />Enviar para revisão</button>
              <div className="grid grid-cols-2 gap-2"><button onClick={() => window.confirm("Confirma a aprovação desta versão?") && executar(() => aprovarRevisaoPublica(token))} disabled={sending} className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-accent text-[12px] font-semibold text-accent-foreground disabled:opacity-50"><Check className="h-4 w-4" />Aprovar</button><button onClick={() => setReprovando((current) => !current)} disabled={sending} className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 text-[12px] font-semibold text-destructive disabled:opacity-50"><XCircle className="h-4 w-4" />Reprovar</button></div>
              {reprovando && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 overflow-hidden"><label className="block text-[11px] font-semibold text-destructive">Justificativa obrigatória</label><textarea value={justificativa} onChange={(event) => setJustificativa(event.target.value)} rows={4} className="w-full resize-none rounded-lg border border-destructive/30 bg-background px-3 py-2 text-[12px] outline-none focus:border-destructive" placeholder="Informe o motivo da reprovação..." /><button onClick={() => justificativa.trim() ? executar(() => reprovarRevisaoPublica(token, justificativa)) : setError("Informe a justificativa da reprovação.")} disabled={sending} className="h-9 w-full rounded-lg bg-destructive text-[11px] font-semibold text-destructive-foreground disabled:opacity-50">Confirmar reprovação</button></motion.div>}
            </div>
          )}
          <p className="px-2 text-center text-[10px] leading-4 text-muted-foreground/40">Versão {versaoAtual?.numero} enviada em {formatDate(versaoAtual?.criadoEm)}. Suas ações ficam registradas no histórico.</p>
        </aside>
      </main>
    </div>
  );
};

export default RevisaoDocumentoPublica;
