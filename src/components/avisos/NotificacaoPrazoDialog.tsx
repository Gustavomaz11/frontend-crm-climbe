import { useState } from "react";
import { AlertTriangle, Clock3, X } from "lucide-react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getNotificacaoApresentacao } from "@/services/notificacaoApresentacao";
import { getNotificacaoDestino, useLerNotificacao, type Notificacao } from "@/services/useNotificacoes";

/** A janela grande fica restrita aos avisos de prazo e atraso das tarefas. */
export const NotificacaoPrazoDialog = ({ notificacao, onDismiss, onRead }: {
  notificacao: Notificacao; onDismiss: () => void; onRead: (destino?: string) => void;
}) => {
  const ler = useLerNotificacao();
  const [erro, setErro] = useState(false);
  const { titulo, mensagem } = getNotificacaoApresentacao(notificacao);
  const destino = getNotificacaoDestino(notificacao.mensagem, notificacao.destino);
  const atrasada = notificacao.tipo === "TAREFA_ATRASADA";
  const Icone = atrasada ? AlertTriangle : Clock3;
  const abrir = async () => {
    setErro(false);
    try { await ler.mutateAsync(notificacao.id); onRead(destino); }
    catch { setErro(true); }
  };

  return <AlertDialog open onOpenChange={open => { if (!open && !ler.isPending) onDismiss(); }}>
    <AlertDialogContent data-notificacao-popup className="max-h-[90dvh] overflow-y-auto rounded-2xl border-border/40 bg-card sm:max-w-lg">
      <AlertDialogHeader>
        <div className="flex items-center justify-between gap-3">
          <span className={`flex items-center gap-2 text-xs font-semibold ${atrasada ? "text-destructive" : "text-accent"}`}>
            <Icone className="h-4 w-4" />{atrasada ? "Tarefa em atraso" : "Prazo da tarefa"}
          </span>
          <button type="button" aria-label="Fechar aviso de prazo" disabled={ler.isPending} onClick={onDismiss} className="app-icon-button"><X className="h-4 w-4" /></button>
        </div>
        <AlertDialogTitle>{titulo}</AlertDialogTitle>
        <AlertDialogDescription className="whitespace-pre-line break-words text-sm leading-relaxed text-foreground/80">{mensagem}</AlertDialogDescription>
      </AlertDialogHeader>
      {erro && <p role="alert" className="text-sm text-destructive">Não conseguimos marcar este aviso como lido. Tente de novo.</p>}
      <p className="text-xs text-muted-foreground">Ao fechar, o aviso continua pendente no sininho.</p>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={ler.isPending}>Agora não</AlertDialogCancel>
        <button type="button" disabled={ler.isPending} onClick={() => void abrir()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50">
          {ler.isPending ? "Abrindo..." : destino ? "Ver tarefa" : "Marcar como lida"}
        </button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
};
