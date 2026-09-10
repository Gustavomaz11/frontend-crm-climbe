import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/api";
import type { PessoaCliente } from "@/services/usePessoas";
import { useUsuarios } from "@/services/useUsuarios";
import { usePipelineFunisAtivos } from "@/services/usePipelineFunis";
import { usePipelineVendas } from "@/services/usePipelineVendas";
import { useCampanhasOpcoes, commercialError } from "@/services/usePipelineCadastros";
import { estrategiaComercialOptions, origemNegocioOptions } from "@/components/pipeline/pipelineNegocioOptions";

export const CriarLeadsDialog = ({ pessoas, onClose }: { pessoas: PessoaCliente[]; onClose: () => void }) => {
  const { data: users = [] } = useUsuarios();
  const { data: funnels = [] } = usePipelineFunisAtivos();
  const funnel = funnels.find(f => f.tipo === "PRE_VENDAS");
  const { data: board } = usePipelineVendas(funnel?.id, !!funnel);
  const { data: campanhas = [] } = useCampanhasOpcoes();
  const [responsavel, setResponsavel] = useState("");
  const [campanha, setCampanha] = useState("");
  const [estrategia, setEstrategia] = useState("Ativa");
  const [origem, setOrigem] = useState("Outbound");
  const [etapa, setEtapa] = useState("");
  const [empresas, setEmpresas] = useState<Record<number, string>>(() => Object.fromEntries(pessoas.map(p => [p.id, p.empresas.length === 1 ? String(p.empresas[0].id) : ""])));
  const [saving, setSaving] = useState(false);
  const client = useQueryClient();
  const input = "mt-1 w-full rounded border border-border/30 bg-background p-2 text-sm";
  const save = async () => {
    setSaving(true);
    try {
      const campanhaSelecionada = campanhas.find(c => c.id === Number(campanha));
      await api.post("/pipeline-vendas/negocios/lote", pessoas.map(p => ({
        pessoaId: p.id, empresaId: Number(empresas[p.id]), nomeEmpresa: p.empresas.find(e => e.id === Number(empresas[p.id]))?.nome,
        nomeContato: p.nome, telefone: p.telefone || "", email: p.email || "", cadastrarEmpresa: false,
        funilId: funnel?.id, etapaId: Number(etapa || board?.etapas[0]?.id), responsavelId: Number(responsavel),
        campanhaOrigemId: campanha ? Number(campanha) : null, estrategiaComercial: campanhaSelecionada?.estrategia || estrategia,
        origemNegocio: origem, servicoInteresse: "", servicosInteresse: [],
      })));
      await Promise.all(["pipeline-vendas", "pipeline-atividades", "pipeline-campaigns"].map(key => client.invalidateQueries({ queryKey: [key] })));
      toast.success(`${pessoas.length} lead(s) criado(s)`); onClose();
    } catch (error) { toast.error(commercialError(error)); } finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><section role="dialog" aria-modal="true" aria-label="Criar leads" className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-auto rounded-xl bg-card p-6"><h2 className="font-semibold">Criar {pessoas.length} lead(s) de pré-vendas</h2><div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs">Responsável<select className={input} value={responsavel} onChange={e => setResponsavel(e.target.value)}><option value="">Selecione</option>{users.map(u => <option key={u.id} value={u.id}>{u.nomeCompleto}</option>)}</select></label>
    <label className="text-xs">Campanha<select className={input} value={campanha} onChange={e => setCampanha(e.target.value)}><option value="">Sem campanha</option>{campanhas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
    <label className="text-xs">Estratégia<select disabled={!!campanha} className={input} value={campanhas.find(c => c.id === Number(campanha))?.estrategia || estrategia} onChange={e => setEstrategia(e.target.value)}>{[...new Set([...estrategiaComercialOptions, ...campanhas.map(c => c.estrategia)])].map(s => <option key={s}>{s}</option>)}</select></label>
    <label className="text-xs">Origem<select className={input} value={origem} onChange={e => setOrigem(e.target.value)}>{origemNegocioOptions.map(o => <option key={o}>{o}</option>)}</select></label>
    <label className="text-xs sm:col-span-2">Etapa inicial<select className={input} value={etapa || board?.etapas[0]?.id || ""} onChange={e => setEtapa(e.target.value)}>{board?.etapas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
    {pessoas.map(p => <label key={p.id} className="text-xs sm:col-span-2">Empresa para {p.nome}<select className={input} value={empresas[p.id]} onChange={e => setEmpresas(current => ({ ...current, [p.id]: e.target.value }))}><option value="">Selecione a empresa desta abordagem</option>{p.empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>)}
  </div><div className="flex justify-end gap-2"><button disabled={saving} onClick={onClose} className="rounded border p-2">Cancelar</button><button disabled={saving || !funnel || !board || !responsavel || pessoas.some(p => !empresas[p.id])} onClick={() => void save()} className="rounded bg-accent p-2 text-accent-foreground disabled:opacity-50">{saving ? "Criando..." : "Criar leads"}</button></div></section></div>;
};
