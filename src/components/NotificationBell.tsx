import { useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-alert-dialog";
import { useAuthStore } from "@/store/useAuthStore";
import { getNotificacaoApresentacao } from "@/services/notificacaoApresentacao";
import { getNotificacaoDestino, useLerNotificacao, useLerTodasNotificacoes, useMinhasNotificacoes, type Notificacao } from "@/services/useNotificacoes";

export function NotificationBell() {
  const usuarioId = useAuthStore(s => s.basicUserData?.id ?? s.userData?.id);
  const { data: notificacoes = [], isLoading, isError } = useMinhasNotificacoes(usuarioId);
  const ler = useLerNotificacao();
  const lerTodas = useLerTodasNotificacoes();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const abrir = (notificacao: Notificacao) => {
    if (!notificacao.lida) ler.mutate(notificacao.id, { onError: () => toast.error("Não foi possível marcar a notificação como lida.") });
    const destino = getNotificacaoDestino(notificacao.mensagem, notificacao.destino);
    if (destino) { setOpen(false); navigate(destino); }
  };

  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild>
      <button type="button" aria-label={`Notificações, ${naoLidas} não lidas`} className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/25 bg-card/20 text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <Bell className="h-4 w-4" />
        {naoLidas > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">{naoLidas > 99 ? "99+" : naoLidas}</span>}
      </button>
    </Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)} />
    <Dialog.Content className="fixed right-3 top-[72px] z-50 w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border/40 bg-card shadow-2xl sm:right-6" aria-label="Notificações">
      <div className="flex items-center justify-between gap-3 border-b border-border/25 p-4">
        <Dialog.Title className="text-sm font-semibold">Notificações</Dialog.Title>
        <Dialog.Description className="sr-only">Avisos de tarefas, reuniões e contratos.</Dialog.Description>
        {naoLidas > 0 && <button type="button" disabled={lerTodas.isPending} onClick={() => lerTodas.mutate(undefined, { onError: () => toast.error("Não foi possível marcar as notificações como lidas.") })} className="flex items-center gap-1 text-xs text-accent disabled:opacity-50"><CheckCheck className="h-4 w-4" />Marcar todas como lidas</button>}
        <Dialog.Cancel aria-label="Fechar notificações" className="shrink-0 rounded p-1 hover:bg-muted/30"><X className="h-4 w-4" /></Dialog.Cancel>
      </div>
      <div className="max-h-[min(65vh,540px)] overflow-y-auto">
        {isLoading ? <p role="status" className="p-5 text-sm text-muted-foreground">Carregando notificações...</p> : isError ? <p role="alert" className="p-5 text-sm text-destructive">Não foi possível carregar suas notificações.</p> : notificacoes.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Você ainda não tem notificações.</p> : notificacoes.map(n => <button type="button" key={n.id} onClick={() => abrir(n)} className={`block w-full border-b border-border/15 p-4 text-left last:border-b-0 hover:bg-muted/30 ${!n.lida ? "bg-accent/5" : ""}`}>
          <div className="flex items-start gap-2"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.lida ? "bg-transparent" : "bg-accent"}`} /><p className="whitespace-pre-line break-words text-xs leading-relaxed">{getNotificacaoApresentacao(n).mensagem}</p></div>
          <p className="ml-4 mt-2 text-[10px] text-muted-foreground">{new Date(n.dataCriacao || n.dataEnvio).toLocaleString("pt-BR")}{getNotificacaoDestino(n.mensagem, n.destino) && " · Abrir detalhes"}</p>
        </button>)}
      </div>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
