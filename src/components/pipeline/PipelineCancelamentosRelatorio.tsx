import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { useCampanhasOpcoes } from "@/services/usePipelineCadastros";
import { useUsuarios } from "@/services/useUsuarios";
import { motivosCancelamento } from "./pipelineCancelamentoOptions";

interface Relatorio { total: number; porMotivo: Record<string, number>; tarefas: { tarefaId: number; titulo: string; contato: string; campanha?: string; responsavel: string; motivo: string; comentario?: string; canceladoEm?: string }[] }
export const PipelineCancelamentosRelatorio = () => {
  const [inicio, setInicio] = useState(""); const [fim, setFim] = useState("");
  const [campanha, setCampanha] = useState(""); const [responsavel, setResponsavel] = useState("");
  const { data: campanhas = [] } = useCampanhasOpcoes(); const { data: users = [] } = useUsuarios();
  const { data, isLoading, error } = useQuery({ queryKey: ["pipeline-dashboard", "cancelamentos", inicio, fim, campanha, responsavel], queryFn: async () => (await api.get<{ data: Relatorio }>("/pipeline-vendas/dashboard/cancelamentos", { params: { inicio: inicio || undefined, fim: fim || undefined, campanhaId: campanha || undefined, responsavelId: responsavel || undefined } })).data.data });
  const input = "rounded border border-border/30 bg-background p-2 text-xs";
  return <section className="mt-6 space-y-4 rounded-xl border border-border/25 p-4"><h2 className="font-semibold">Cancelamentos de tarefas</h2><div className="flex flex-wrap gap-2"><label className="text-xs">De <input aria-label="Cancelamentos desde" className={input} type="date" value={inicio} onChange={e => setInicio(e.target.value)} /></label><label className="text-xs">Até <input aria-label="Cancelamentos até" className={input} type="date" value={fim} onChange={e => setFim(e.target.value)} /></label><select aria-label="Campanha dos cancelamentos" className={input} value={campanha} onChange={e => setCampanha(e.target.value)}><option value="">Todas as campanhas</option>{campanhas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select><select aria-label="Responsável pelos cancelamentos" className={input} value={responsavel} onChange={e => setResponsavel(e.target.value)}><option value="">Todos os responsáveis</option>{users.map(u => <option key={u.id} value={u.id}>{u.nomeCompleto}</option>)}</select></div>
    {isLoading && <p>Carregando cancelamentos...</p>}{error && <p className="text-destructive">Não foi possível carregar o relatório. Confira o período.</p>}
    {data && <><p className="text-sm">{data.total} tarefa(s) cancelada(s)</p><div className="flex flex-wrap gap-3">{Object.entries(data.porMotivo).map(([motivo, quantidade]) => <span key={motivo} className="rounded bg-muted/30 p-2 text-xs">{motivosCancelamento[motivo] || "Sem motivo registrado (legado)"}: {quantidade}</span>)}</div><div className="max-h-96 overflow-auto"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Tarefa / contato</th><th>Campanha</th><th>Responsável</th><th>Motivo / comentário</th><th>Data</th></tr></thead><tbody>{data.tarefas.map(t => <tr key={t.tarefaId} className="border-t border-border/20"><td className="p-2">{t.titulo}<br />{t.contato}</td><td>{t.campanha || "Sem campanha"}</td><td>{t.responsavel}</td><td>{motivosCancelamento[t.motivo] || "Sem motivo legado"}<br />{t.comentario}</td><td>{t.canceladoEm ? new Date(t.canceladoEm).toLocaleString("pt-BR") : "Não registrada"}</td></tr>)}</tbody></table></div></>}
  </section>;
};
