import type { Dispatch, SetStateAction } from "react";
import type { Empresa } from "@/services/useEmpresas";
import type { PipelineEtapa } from "@/services/usePipelineVendas";
import type { Usuario } from "@/services/useUsuarios";
import type { PipelineNegocioDraft } from "./pipelineNegocioForm";
import {
  estrategiaComercialOptions,
  origemNegocioOptions,
  servicoInteresseOptions,
} from "./pipelineNegocioOptions";

interface PipelineNegocioFormFieldsProps {
  draft: PipelineNegocioDraft;
  setDraft: Dispatch<SetStateAction<PipelineNegocioDraft>>;
  empresas: Empresa[];
  usuarios: Usuario[];
  etapas: PipelineEtapa[];
  disabled: boolean;
}

const fieldClass = "h-10 w-full rounded-lg border border-border/30 bg-background/70 px-3 text-[12px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/35 focus:border-accent/45 disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "mb-1.5 block text-[11px] font-medium text-foreground/70";

export const PipelineNegocioFormFields = ({
  draft,
  setDraft,
  empresas,
  usuarios,
  etapas,
  disabled,
}: PipelineNegocioFormFieldsProps) => {
  const update = (field: keyof PipelineNegocioDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const selectEmpresa = (empresaId: string) => {
    const empresa = empresas.find((item) => item.id === Number(empresaId));
    setDraft((current) => ({
      ...current,
      empresaId,
      nomeEmpresa: empresa?.nome || current.nomeEmpresa,
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label><span className={labelClass}>Empresa cadastrada</span><select value={draft.empresaId} onChange={(event) => selectEmpresa(event.target.value)} disabled={disabled} className={fieldClass}><option value="">Potencial cliente sem cadastro</option>{empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</select></label>
      <label><span className={labelClass}>Nome da empresa *</span><input value={draft.nomeEmpresa} onChange={(event) => update("nomeEmpresa", event.target.value)} disabled={disabled} className={fieldClass} placeholder="Ex.: Apex Ventures" /></label>
      <label><span className={labelClass}>Nome do contato *</span><input value={draft.nomeContato} onChange={(event) => update("nomeContato", event.target.value)} disabled={disabled} className={fieldClass} /></label>
      <label><span className={labelClass}>Responsável *</span><select value={draft.responsavelId} onChange={(event) => update("responsavelId", event.target.value)} disabled={disabled} className={fieldClass}><option value="">Selecione</option>{usuarios.filter((usuario) => !usuario.situacao || usuario.situacao === "ATIVO").map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nomeCompleto}</option>)}</select></label>
      <label><span className={labelClass}>Telefone *</span><input value={draft.telefone} onChange={(event) => update("telefone", event.target.value)} disabled={disabled} className={fieldClass} /></label>
      <label><span className={labelClass}>E-mail *</span><input type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} disabled={disabled} className={fieldClass} /></label>
      <label><span className={labelClass}>Etapa atual</span><select value={draft.etapaId} onChange={(event) => update("etapaId", event.target.value)} disabled={disabled} className={fieldClass}><option value="">Primeira etapa do funil</option>{etapas.map((etapa) => <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>)}</select></label>
      <label><span className={labelClass}>Data da reunião</span><input type="datetime-local" value={draft.dataReuniao} onChange={(event) => update("dataReuniao", event.target.value)} disabled={disabled} className={fieldClass} /></label>
      <label><span className={labelClass}>Origem do negócio *</span><select value={draft.origemNegocio} onChange={(event) => update("origemNegocio", event.target.value)} disabled={disabled} className={fieldClass}><option value="">Selecione</option>{origemNegocioOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      <label><span className={labelClass}>Serviço de interesse *</span><select value={draft.servicoInteresse} onChange={(event) => update("servicoInteresse", event.target.value)} disabled={disabled} className={fieldClass}><option value="">Selecione</option>{servicoInteresseOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      <label><span className={labelClass}>Valor estimado da proposta</span><input type="number" min="0" step="0.01" value={draft.valorEstimadoProposta} onChange={(event) => update("valorEstimadoProposta", event.target.value)} disabled={disabled} className={fieldClass} /></label>
      <label className="md:col-span-2"><span className={labelClass}>Estratégia comercial *</span><select value={draft.estrategiaComercial} onChange={(event) => update("estrategiaComercial", event.target.value)} disabled={disabled} className={fieldClass}><option value="">Selecione</option>{estrategiaComercialOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      <label className="md:col-span-2"><span className={labelClass}>Observações</span><textarea value={draft.observacoes} onChange={(event) => update("observacoes", event.target.value)} disabled={disabled} className={`${fieldClass} min-h-24 py-2.5`} /></label>
    </div>
  );
};
