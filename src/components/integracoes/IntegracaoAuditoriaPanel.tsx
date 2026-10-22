import { X } from "lucide-react";
import { erroIntegracao, useAuditoriaIntegracao } from "@/services/useIntegracoes";

export function IntegracaoAuditoriaPanel({ id, nome, onFechar }: { id: string; nome: string; onFechar: () => void }) {
  const { data = [], isLoading, error } = useAuditoriaIntegracao(id);
  return <section className="rounded-2xl border border-border/40 bg-card/50 p-5" aria-label="Histórico da integração">
    <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Histórico · {nome}</h2><button onClick={onFechar} aria-label="Fechar histórico"><X size={18} /></button></div>
    <p className="mb-3 text-xs text-muted-foreground">Últimos 100 eventos e requisições.</p>
    {isLoading && <p className="text-sm">Carregando histórico…</p>}
    {error && <p role="alert" className="text-sm text-destructive">{erroIntegracao(error)}</p>}
    <div className="max-h-80 overflow-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-border"><th className="p-2">Data</th><th className="p-2">Evento</th><th className="p-2">Operação</th><th className="p-2">HTTP</th></tr></thead>
      <tbody>{data.map(e => <tr key={e.id} className="border-b border-border/20"><td className="whitespace-nowrap p-2">{new Date(e.criadoEm).toLocaleString("pt-BR")}</td><td className="p-2">{e.evento.split("_").join(" ")}</td><td className="break-all p-2 font-mono">{e.metodo} {e.rota}</td><td className="p-2">{e.status ?? "—"}</td></tr>)}</tbody></table></div>
    {!isLoading && !error && !data.length && <p className="mt-4 text-sm text-muted-foreground">Nenhum evento registrado.</p>}
  </section>;
}
