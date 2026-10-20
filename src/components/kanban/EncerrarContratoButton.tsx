import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEncerrarContratoServico } from "@/services/useEncerrarContratoServico";
import type { CommercialService } from "@/services/commercialProposal";

export const EncerrarContratoButton = ({ contratoId, servico, titulo, permitido, onClosed }: {
  contratoId: number;
  servico: CommercialService | null;
  titulo: string;
  permitido: boolean;
  onClosed: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const mutation = useEncerrarContratoServico();
  return <AlertDialog open={open} onOpenChange={value => {
    if (!mutation.isPending) { setOpen(value); mutation.reset(); }
  }}>
    <AlertDialogTrigger asChild>
      <button type="button" disabled={!permitido || mutation.isPending}
        title={permitido ? "Encerrar o serviço deste quadro" : "Somente o responsável por este serviço pode encerrá-lo"}
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border/30 px-3 text-xs font-semibold hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-50">
        <CheckCircle2 className="h-4 w-4" />Encerrar Contrato
      </button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Encerrar {titulo}?</AlertDialogTitle>
        <AlertDialogDescription>
          Este serviço será encerrado e seu quadro sairá do painel de Kanban. As tarefas, os arquivos e o histórico serão preservados. Os outros serviços da empresa continuarão ativos.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
        <button type="button" disabled={mutation.isPending} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          onClick={async () => {
            try { await mutation.mutateAsync({ contratoId, servico }); setOpen(false); onClosed(); }
            catch { /* O erro permanece no diálogo para permitir nova tentativa. */ }
          }}>{mutation.isPending ? "Encerrando..." : "Confirmar encerramento"}</button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
};
