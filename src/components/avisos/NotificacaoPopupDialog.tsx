import { Bell, X } from "lucide-react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getNotificacaoDestino, useLerNotificacao, type Notificacao } from "@/services/useNotificacoes";

const titulos: Record<string, string> = {
  TAREFA_ATRIBUIDA: "Tarefa atribuída a você",
  PROPOSTA_ACEITA: "Proposta aceita",
  PROPOSTA_REVISAO_SOLICITADA: "Cliente solicitou revisão da proposta",
  PROPOSTA_REPROVADA: "Proposta reprovada pelo cliente",
  CONTRATO_CRIADO: "Novo contrato",
  CONTRATO_APROVADO: "Contrato aprovado",
  CONTRATO_REVISAO_SOLICITADA: "Cliente solicitou revisão do contrato",
  CONTRATO_REPROVADO: "Contrato reprovado pelo cliente",
  CONTRATO_ENVIADO: "Contrato enviado ao cliente",
};

export const NotificacaoPopupDialog = ({ notificacao, onDismiss, onRead }: {
  notificacao: Notificacao; onDismiss: () => void; onRead: (destino?: string) => void;
}) => {
  const ler = useLerNotificacao();
  const destino = getNotificacaoDestino(notificacao.mensagem, notificacao.destino);
  const abrir = async () => {
    try {
      await ler.mutateAsync(notificacao.id);
      onRead(destino);
    } catch { /* A mensagem de erro fica no popup, permitindo nova tentativa. */ }
  };
  return <AlertDialog open onOpenChange={open => { if (!open && !ler.isPending) onDismiss(); }}>
    <AlertDialogContent data-notificacao-popup className="max-h-[90dvh] overflow-y-auto rounded-2xl border-border/40 bg-card sm:max-w-lg">
      <AlertDialogHeader>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-accent"><Bell className="h-4 w-4" />Notificação do Climbe</span>
          <button type="button" aria-label="Fechar notificação" disabled={ler.isPending} onClick={onDismiss} className="app-icon-button"><X className="h-4 w-4" /></button>
        </div>
        <AlertDialogTitle>{titulos[notificacao.tipo] ?? "Nova notificação"}</AlertDialogTitle>
        <AlertDialogDescription className="whitespace-pre-line break-words text-sm leading-relaxed text-foreground/80">
          {notificacao.mensagem}
        </AlertDialogDescription>
      </AlertDialogHeader>
      {ler.error && <p role="alert" className="text-sm text-destructive">Não foi possível marcar a notificação como lida. Tente novamente.</p>}
      <p className="text-xs text-muted-foreground">Ao fechar, o aviso continua pendente no sininho.</p>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={ler.isPending}>Agora não</AlertDialogCancel>
        <button type="button" disabled={ler.isPending} onClick={() => void abrir()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50">
          {ler.isPending ? "Abrindo..." : destino ? "Ver detalhes" : "Marcar como lida"}
        </button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
};
