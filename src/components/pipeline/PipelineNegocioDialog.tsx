import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, FileCheck2, ListTodo, MessageSquareText, RefreshCw, Save, Trophy, X, XCircle } from "lucide-react";
import type { Empresa } from "@/services/useEmpresas";
import type { PipelineEtapa, PipelineNegocio, PipelineNegocioInput } from "@/services/usePipelineVendas";
import type { PipelineMotivoPerda } from "@/services/usePipelineMotivosPerda";
import type { Usuario } from "@/services/useUsuarios";
import { PipelineComentariosPanel } from "./PipelineComentariosPanel";
import { PipelineHistoricoPanel } from "./PipelineHistoricoPanel";
import { PipelineNegocioFormFields } from "./PipelineNegocioFormFields";
import { PipelineTarefasPanel } from "./PipelineTarefasPanel";
import { PipelinePerdaDialog } from "./PipelinePerdaDialog";
import { draftToNegocioInput, emptyPipelineNegocioDraft, isPipelineNegocioDraftValid, negocioToDraft } from "./pipelineNegocioForm";

type DialogTab = "dados" | "tarefas" | "comentarios" | "historico";

interface PipelineNegocioDialogProps {
  negocio: PipelineNegocio | null;
  initialEtapaId?: number;
  initialResponsavelId?: number | null;
  etapas: PipelineEtapa[];
  empresas: Empresa[];
  usuarios: Usuario[];
  motivosPerda: PipelineMotivoPerda[];
  canEdit: boolean;
  canConclude: boolean;
  canConvert: boolean;
  canViewTasks: boolean;
  canCreateTask: boolean;
  canEditTask: boolean;
  canConcludeTask: boolean;
  canViewComments: boolean;
  canCreateComment: boolean;
  canViewHistory: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onSave: (data: PipelineNegocioInput) => void;
  onConclude: (resultado: "GANHO" | "PERDIDO", motivoId?: number, observacao?: string) => void;
  onReactivate: () => void;
  onConvert: (empresaId: number) => void;
  onOpenContract: (contratoId: number) => void;
}

const tabs: { value: DialogTab; label: string; icon: typeof ListTodo }[] = [
  { value: "dados", label: "Dados", icon: FileCheck2 },
  { value: "tarefas", label: "Tarefas", icon: ListTodo },
  { value: "comentarios", label: "Comentários", icon: MessageSquareText },
  { value: "historico", label: "Histórico", icon: Activity },
];

export const PipelineNegocioDialog = ({
  negocio,
  initialEtapaId,
  initialResponsavelId,
  etapas,
  empresas,
  usuarios,
  motivosPerda,
  canEdit,
  canConclude,
  canConvert,
  canViewTasks,
  canCreateTask,
  canEditTask,
  canConcludeTask,
  canViewComments,
  canCreateComment,
  canViewHistory,
  isProcessing,
  onClose,
  onSave,
  onConclude,
  onReactivate,
  onConvert,
  onOpenContract,
}: PipelineNegocioDialogProps) => {
  const isCreating = !negocio;
  const [activeTab, setActiveTab] = useState<DialogTab>("dados");
  const [showConversion, setShowConversion] = useState(false);
  const [showLoss, setShowLoss] = useState(false);
  const [conversionEmpresaId, setConversionEmpresaId] = useState("");
  const initialDraft = useMemo(() => negocio ? negocioToDraft(negocio) : {
    ...emptyPipelineNegocioDraft,
    etapaId: initialEtapaId ? String(initialEtapaId) : "",
    responsavelId: initialResponsavelId ? String(initialResponsavelId) : "",
  }, [initialEtapaId, initialResponsavelId, negocio]);
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    setDraft(initialDraft);
    setConversionEmpresaId(negocio?.empresaId ? String(negocio.empresaId) : "");
    setShowConversion(false);
    setShowLoss(false);
    setActiveTab(negocio ? "tarefas" : "dados");
  }, [initialDraft, negocio]);

  const canSave = !isProcessing && (isCreating || canEdit) && isPipelineNegocioDraftValid(draft);
  const openConversion = () => {
    setActiveTab("dados");
    setShowConversion((current) => !current);
  };

  return (
    <>
      <motion.button type="button" aria-label="Fechar modal" className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isProcessing && onClose()} />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.section role="dialog" aria-modal="true" className="pointer-events-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border/30 bg-card shadow-2xl" initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }}>
          <header className="flex items-center justify-between border-b border-border/20 px-6 py-4"><div><h2 className="text-[16px] font-semibold text-foreground">{isCreating ? "Novo negócio" : negocio.nomeEmpresa}</h2><p className="mt-0.5 text-[11px] text-muted-foreground/50">{isCreating ? "Cadastre uma oportunidade no funil comercial" : `${negocio.etapaNome} · ${negocio.responsavelNome}`}</p></div><button type="button" onClick={onClose} disabled={isProcessing} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/30 hover:text-foreground"><X className="h-4 w-4" /></button></header>

          {!isCreating && <nav className="flex gap-1 overflow-x-auto border-b border-border/20 px-6 py-2">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)} className={`flex h-8 items-center gap-2 rounded-lg px-3 text-[10px] font-medium ${activeTab === tab.value ? "bg-accent/12 text-accent" : "text-muted-foreground hover:bg-muted/25 hover:text-foreground"}`}><Icon className="h-3.5 w-3.5" />{tab.label}</button>; })}</nav>}

          <div className="overflow-y-auto p-6">
            {activeTab === "dados" && <><PipelineNegocioFormFields draft={draft} setDraft={setDraft} empresas={empresas} usuarios={usuarios} etapas={etapas.filter((etapa) => etapa.resultado === "ABERTO" || etapa.id === negocio?.etapaId)} disabled={isProcessing || (!isCreating && !canEdit)} />{negocio?.resultado === "PERDIDO" && negocio.motivoPerdaNome && <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4"><p className="text-[10px] uppercase tracking-wide text-red-500/70">Motivo da perda</p><p className="mt-1 text-xs font-semibold text-red-500">{negocio.motivoPerdaNome}</p>{negocio.observacaoPerda && <p className="mt-2 text-[11px] text-muted-foreground">{negocio.observacaoPerda}</p>}</div>}{showConversion && <div className="mt-5 rounded-xl border border-accent/25 bg-accent/5 p-4"><p className="text-[12px] font-semibold text-foreground">Converter em contrato</p><p className="mt-1 text-[10px] text-muted-foreground/55">Selecione a empresa cadastrada que será vinculada ao contrato pendente.</p><div className="mt-3 flex gap-2"><select value={conversionEmpresaId} onChange={(event) => setConversionEmpresaId(event.target.value)} className="h-9 flex-1 rounded-lg border border-border/30 bg-background px-3 text-[11px] outline-none"><option value="">Selecione a empresa</option>{empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</select><button type="button" disabled={!conversionEmpresaId || isProcessing} onClick={() => onConvert(Number(conversionEmpresaId))} className="rounded-lg bg-accent px-3 text-[11px] font-semibold text-accent-foreground disabled:opacity-50">Gerar contrato</button></div></div>}</>}
            {activeTab === "tarefas" && negocio && <PipelineTarefasPanel negocioId={negocio.id} responsavelId={negocio.responsavelId} usuarios={usuarios} canView={canViewTasks} canCreate={canCreateTask} canEdit={canEditTask} canConclude={canConcludeTask} />}
            {activeTab === "comentarios" && negocio && <PipelineComentariosPanel negocioId={negocio.id} canView={canViewComments} canCreate={canCreateComment} />}
            {activeTab === "historico" && negocio && <PipelineHistoricoPanel negocioId={negocio.id} canView={canViewHistory} />}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/20 px-6 py-4"><div className="flex flex-wrap gap-2">{negocio?.resultado === "ABERTO" && canConclude && <><button type="button" onClick={() => onConclude("GANHO")} disabled={isProcessing} className="flex h-9 items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 text-[11px] font-semibold text-emerald-500"><Trophy className="h-3.5 w-3.5" />Marcar ganho</button><button type="button" onClick={() => setShowLoss(true)} disabled={isProcessing} className="flex h-9 items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/5 px-3 text-[11px] font-semibold text-red-500"><XCircle className="h-3.5 w-3.5" />Marcar perdido</button></>}{negocio && negocio.resultado !== "ABERTO" && canConclude && <button type="button" onClick={onReactivate} disabled={isProcessing} className="flex h-9 items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/5 px-3 text-[11px] font-semibold text-sky-500"><RefreshCw className="h-3.5 w-3.5" />Reativar negócio</button>}{negocio?.resultado === "GANHO" && !negocio.contratoId && canConvert && <button type="button" onClick={openConversion} className="flex h-9 items-center gap-2 rounded-lg border border-accent/25 bg-accent/5 px-3 text-[11px] font-semibold text-accent"><FileCheck2 className="h-3.5 w-3.5" />Converter em contrato</button>}{negocio?.contratoId && <button type="button" onClick={() => onOpenContract(negocio.contratoId!)} className="flex h-9 items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 text-[11px] font-semibold text-emerald-500"><CheckCircle2 className="h-3.5 w-3.5" />Abrir contrato CT-{negocio.contratoId}</button>}</div>{activeTab === "dados" && (isCreating || canEdit) && <button type="button" onClick={() => onSave(draftToNegocioInput(draft))} disabled={!canSave} className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[11px] font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-3.5 w-3.5" />{isProcessing ? "Salvando..." : isCreating ? "Criar negócio" : "Salvar alterações"}</button>}</footer>
        </motion.section>
      </div>
      {showLoss && negocio && <PipelinePerdaDialog empresa={negocio.nomeEmpresa} motivos={motivosPerda} isProcessing={isProcessing} onCancel={() => setShowLoss(false)} onConfirm={(motivoId, observacao) => { onConclude("PERDIDO", motivoId, observacao); setShowLoss(false); }} />}
    </>
  );
};
