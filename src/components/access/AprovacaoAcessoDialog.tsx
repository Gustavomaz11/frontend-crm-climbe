import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GrupoPermissao, Permissao } from "@/services/usePermissoes";
import type { Cargo } from "@/services/useUsuarios";

type AcaoConfirmacao = "aprovar" | "recusar";

interface AprovacaoAcessoDialogProps {
  acao: AcaoConfirmacao;
  nomeUsuario: string;
  cargos: Cargo[];
  permissoes: Permissao[];
  grupos: GrupoPermissao[];
  cargoId: number | null;
  permissaoIds: Set<number>;
  isProcessing: boolean;
  isLoadingOptions: boolean;
  onCargoChange: (cargoId: number | null) => void;
  onTogglePermissao: (permissaoId: number) => void;
  onApplyGrupo: (permissaoIds: number[]) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const AprovacaoAcessoDialog = ({
  acao,
  nomeUsuario,
  cargos,
  permissoes,
  grupos,
  cargoId,
  permissaoIds,
  isProcessing,
  isLoadingOptions,
  onCargoChange,
  onTogglePermissao,
  onApplyGrupo,
  onCancel,
  onConfirm,
}: AprovacaoAcessoDialogProps) => {
  const isApproval = acao === "aprovar";
  const canConfirm = !isProcessing
    && (!isApproval || (!isLoadingOptions && cargoId !== null && permissaoIds.size > 0));

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isProcessing && onCancel()}
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="pointer-events-auto w-full max-w-lg"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-border/30 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isApproval ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
              {isApproval
                ? <Check className="h-5 w-5 text-emerald-500" />
                : <X className="h-5 w-5 text-red-500" />}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">
                {isApproval ? "Aprovar e configurar acesso" : "Recusar acesso"}
              </h2>
              <p className="text-[11px] text-muted-foreground/50">{nomeUsuario}</p>
            </div>
          </div>

          {isApproval ? (
            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-foreground/75">
                  Cargo <span className="text-red-500">*</span>
                </label>
                <select
                  value={cargoId ?? ""}
                  onChange={(event) => onCargoChange(event.target.value ? Number(event.target.value) : null)}
                  disabled={isLoadingOptions || isProcessing}
                  className="h-10 w-full rounded-lg border border-border/30 bg-background px-3 text-[12px] text-foreground outline-none transition-colors focus:border-accent/50"
                >
                  <option value="">Selecione o cargo</option>
                  {cargos.map((cargo) => (
                    <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                {grupos.length > 0 && (
                  <div className="mb-4">
                    <label className="mb-1.5 block text-[11px] font-medium text-foreground/75">Grupo de permissões</label>
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        const grupo = grupos.find((item) => item.id === Number(event.target.value));
                        if (grupo) onApplyGrupo(grupo.permissoes.map((permissao) => permissao.id));
                      }}
                      disabled={isProcessing}
                      className="h-10 w-full rounded-lg border border-border/30 bg-background px-3 text-[12px] text-foreground outline-none focus:border-accent/50"
                    >
                      <option value="">Aplicar um grupo...</option>
                      {grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>)}
                    </select>
                  </div>
                )}
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] font-medium text-foreground/75">
                    Permissões <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground/45">
                    {permissaoIds.size} selecionada(s)
                  </span>
                </div>
                <div className="max-h-60 space-y-2 overflow-y-auto rounded-xl border border-border/25 bg-background/45 p-3">
                  {isLoadingOptions ? (
                    <p className="py-6 text-center text-[11px] text-muted-foreground/45">Carregando opções...</p>
                  ) : permissoes.length === 0 ? (
                    <p className="py-6 text-center text-[11px] text-muted-foreground/45">Nenhuma permissão disponível.</p>
                  ) : (
                    permissoes.map((permissao) => (
                      <label
                        key={permissao.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/20 px-3 py-2.5 transition-colors hover:bg-muted/20"
                      >
                        <input
                          type="checkbox"
                          checked={permissaoIds.has(permissao.id)}
                          onChange={() => onTogglePermissao(permissao.id)}
                          disabled={isProcessing}
                          className="mt-0.5 h-4 w-4 accent-[hsl(var(--accent))]"
                        />
                        <span className="min-w-0">
                          <span className="block text-[11px] font-medium text-foreground">{permissao.nome}</span>
                          <span className="block text-[10px] text-muted-foreground/45">{permissao.descricao || permissao.codigo}</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground/40">
                  Selecione ao menos uma permissão para liberar o acesso.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-[12px] leading-relaxed text-foreground/70">
              Tem certeza que deseja recusar esta solicitação? Ela será removida da fila de pendentes.
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-[12px]" onClick={onCancel} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className={`flex-1 border-0 text-[12px] text-white ${isApproval ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}
              onClick={onConfirm}
              disabled={!canConfirm}
            >
              {isProcessing ? "Processando..." : isApproval ? "Aprovar acesso" : "Recusar acesso"}
            </Button>
          </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};
