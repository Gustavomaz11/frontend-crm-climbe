import { useState } from "react";
import { X } from "lucide-react";
import { type AuditoriaIntegracao, erroIntegracao, useAuditoriaIntegracao, usePayloadAuditoriaIntegracao } from "@/services/useIntegracoes";

const formatarPayload = (valor: string) => {
  try { return JSON.stringify(JSON.parse(valor), null, 2); } catch { return valor; }
};

export function IntegracaoAuditoriaPanel({ id, nome, onFechar }: { id: string; nome: string; onFechar: () => void }) {
  const { data = [], isLoading, error } = useAuditoriaIntegracao(id);
  const [selecionado, setSelecionado] = useState<AuditoriaIntegracao | null>(null);
  const payload = usePayloadAuditoriaIntegracao(id, selecionado?.id);
  return <section className="rounded-2xl border border-border/40 bg-card/50 p-5" aria-label="Histórico da integração">
    <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Histórico · {nome}</h2><button onClick={onFechar} aria-label="Fechar histórico"><X size={18} /></button></div>
    <p className="mb-3 text-xs text-muted-foreground">Últimos 100 eventos e requisições.</p>
    {isLoading && <p className="text-sm">Carregando histórico…</p>}
    {error && <p role="alert" className="text-sm text-destructive">{erroIntegracao(error)}</p>}
    <div className="max-h-80 overflow-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-border"><th className="p-2">Data</th><th className="p-2">Evento</th><th className="p-2">Operação</th><th className="p-2">HTTP</th><th className="p-2">Payload</th></tr></thead>
      <tbody>{data.map(e => <tr key={e.id} className="border-b border-border/20"><td className="whitespace-nowrap p-2">{new Date(e.criadoEm).toLocaleString("pt-BR")}</td><td className="p-2">{e.evento.split("_").join(" ")}</td><td className="break-all p-2 font-mono">{e.metodo} {e.rota}</td><td className="p-2">{e.status ?? "—"}</td>
        <td className="whitespace-nowrap p-2">{e.payloadDisponivel ? <button aria-expanded={selecionado?.id === e.id} onClick={() => setSelecionado(atual => atual?.id === e.id ? null : e)} className="rounded-md border border-primary/30 px-2 py-1 text-primary hover:bg-primary/10">{selecionado?.id === e.id ? "Ocultar payload" : "Ver payload"}</button>
          : <span className="text-muted-foreground">{e.payloadLimiteExcedido ? "Acima de 64 KB" : e.metodo === "POST" && e.status === 201 ? "Não registrado" : "—"}</span>}</td>
      </tr>)}</tbody></table></div>
    {selecionado && <div role="region" aria-label="Payload enviado" className="mt-4 rounded-xl border border-border/40 bg-background/60 p-4">
      <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">Payload enviado</h3><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{selecionado.metodo} {selecionado.rota}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(selecionado.criadoEm).toLocaleString("pt-BR")} · HTTP {selecionado.status}</p></div><button aria-label="Fechar payload" onClick={() => setSelecionado(null)}><X size={16} /></button></div>
      {payload.isLoading && <p className="mt-3 text-sm">Carregando payload…</p>}
      {payload.error && <p role="alert" className="mt-3 text-sm text-destructive">{erroIntegracao(payload.error)}</p>}
      {payload.data && <><p className="mt-3 text-xs text-muted-foreground">Campos de credenciais são ocultados.</p><pre aria-label="JSON enviado" className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted/30 p-3 text-xs">{formatarPayload(payload.data.payload)}</pre></>}
    </div>}
    {!isLoading && !error && !data.length && <p className="mt-4 text-sm text-muted-foreground">Nenhum evento registrado.</p>}
  </section>;
}
