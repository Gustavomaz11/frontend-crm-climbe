import { useState } from "react";
import type { CadenceStep } from "@/services/usePipelineCampanhas";
import type { PipelineScript } from "@/services/usePipelineScripts";
import { preVendaEtapas } from "@/services/usePipelineCadastros";
import { PipelineCadenciaEditor } from "./PipelineCadenciaEditor";

export const PipelineCadenciaPorEtapa = ({ steps, scripts, onChange }: { steps: CadenceStep[]; scripts: PipelineScript[]; onChange: (steps: CadenceStep[]) => void }) => {
  const [stage, setStage] = useState<string>("TENTATIVA_CONTATO");
  const legacy = steps.some(s => !s.etapaFunilCodigo);
  if (legacy) return <section className="space-y-3"><p className="text-xs text-muted-foreground">Esta campanha usa uma sequência geral. As execuções iniciadas manterão sua versão.</p><button type="button" className="rounded border p-2 text-xs" onClick={() => onChange(steps.map(s => ({ ...s, etapaFunilCodigo: stage })))}>Usar esta sequência em Tentativa de contato</button><PipelineCadenciaEditor steps={steps} scripts={scripts} onChange={onChange} /></section>;
  const selected = steps.filter(s => s.etapaFunilCodigo === stage);
  return <section className="space-y-3"><label className="block text-xs">Etapa de pré-vendas<select className="ml-3 rounded border border-border bg-background p-2" value={stage} onChange={e => setStage(e.target.value)}>{preVendaEtapas.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}</select></label><p className="text-xs text-muted-foreground">Ao entrar nesta etapa, o lead inicia este fluxo. Uma etapa vazia não gera tarefas.</p>
    <PipelineCadenciaEditor steps={selected} scripts={scripts} onChange={next => onChange([...steps.filter(s => s.etapaFunilCodigo !== stage), ...next.map(s => ({ ...s, etapaFunilCodigo: stage }))])} />
  </section>;
};
