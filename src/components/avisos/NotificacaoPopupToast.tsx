import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { getNotificacaoApresentacao } from "@/services/notificacaoApresentacao";
import { getNotificacaoDestino, useLerNotificacao, type Notificacao } from "@/services/useNotificacoes";

export const NotificacaoPopupToast = ({ notificacao, onDismiss, onRead }: {
  notificacao: Notificacao; onDismiss: () => void; onRead: (destino?: string) => void;
}) => {
  const { mutateAsync: marcarComoLida } = useLerNotificacao();
  const callbacks = useRef({ onDismiss, onRead });
  callbacks.current = { onDismiss, onRead };
  const { titulo, mensagem } = getNotificacaoApresentacao(notificacao);
  const destino = getNotificacaoDestino(notificacao.mensagem, notificacao.destino);
  const notificacaoId = notificacao.id;

  useEffect(() => {
    let montado = true;
    let abrindo = false;
    let toastId: string | number | undefined;
    const opcoes = {
      duration: 8000,
      closeButton: true,
      icon: <Bell className="h-4 w-4 text-accent" />,
      description: mensagem,
      classNames: { description: "line-clamp-3 break-words whitespace-pre-line" },
      onDismiss: () => callbacks.current.onDismiss(),
      onAutoClose: () => callbacks.current.onDismiss(),
      action: {
        label: destino ? "Ver detalhes" : "Marcar como lida",
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
          // O toast só fecha após a confirmação da leitura, permitindo tentar de novo se falhar.
          event.preventDefault();
          if (abrindo || !montado) return;
          abrindo = true;
          toast.message(titulo, { ...opcoes, id: toastId, duration: Infinity });
          void marcarComoLida(notificacaoId)
            .then(() => callbacks.current.onRead(destino))
            .catch(() => {
              if (montado) toast.error("Não conseguimos marcar este aviso como lido. Tente de novo.", { ...opcoes, id: toastId });
            })
            .finally(() => { abrindo = false; });
        },
      },
    };
    // Cada apresentação recebe seu próprio ID para não reutilizar um toast em animação de saída.
    const agendamento = window.setTimeout(() => { toastId = toast.message(titulo, opcoes); }, 0);
    return () => {
      montado = false;
      window.clearTimeout(agendamento);
      if (toastId !== undefined) toast.dismiss(toastId);
    };
  }, [notificacaoId, titulo, mensagem, destino, marcarComoLida]);

  return null;
};
