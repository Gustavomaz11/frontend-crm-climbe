import { Reply, Send, X } from "lucide-react";
import type { PipelineCommentNode } from "./pipelineCommentThreads";

interface PipelineCommentThreadProps {
  comment: PipelineCommentNode;
  canReply: boolean;
  replyingToId: number | null;
  replyContent: string;
  isSubmitting: boolean;
  depth?: number;
  onStartReply: (comment: PipelineCommentNode) => void;
  onCancelReply: () => void;
  onReplyContentChange: (value: string) => void;
  onSubmitReply: (comment: PipelineCommentNode) => void;
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
}).format(new Date(value));

export const PipelineCommentThread = ({
  comment,
  canReply,
  replyingToId,
  replyContent,
  isSubmitting,
  depth = 0,
  onStartReply,
  onCancelReply,
  onReplyContentChange,
  onSubmitReply,
}: PipelineCommentThreadProps) => {
  const isReplying = replyingToId === comment.id;

  return (
    <div className={depth > 0 ? "ml-4 border-l border-accent/20 pl-3" : undefined}>
      <article className="rounded-xl border border-border/20 bg-background/30 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold">{comment.autorNome}</p>
          <time className="text-[8px] text-muted-foreground/45">
            {formatDateTime(comment.criadoEm)}
          </time>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground/80">
          {comment.conteudo}
        </p>

        {canReply && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              aria-label={`Responder ao comentário de ${comment.autorNome}`}
              onClick={() => onStartReply(comment)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-medium text-muted-foreground hover:bg-muted/30 hover:text-accent"
            >
              <Reply className="h-3 w-3" />
              Responder
            </button>
          </div>
        )}

        {isReplying && (
          <div className="mt-3 rounded-lg border border-accent/25 bg-card/60 p-2.5">
            <textarea
              autoFocus
              value={replyContent}
              onChange={(event) => onReplyContentChange(event.target.value)}
              placeholder={`Responder a ${comment.autorNome}...`}
              className="min-h-16 w-full resize-none bg-transparent text-[10px] leading-relaxed outline-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelReply}
                disabled={isSubmitting}
                className="flex h-7 items-center gap-1 rounded-md px-2 text-[9px] text-muted-foreground hover:bg-muted/30"
              >
                <X className="h-3 w-3" />
                Cancelar
              </button>
              <button
                type="button"
                aria-label="Enviar resposta"
                onClick={() => onSubmitReply(comment)}
                disabled={!replyContent.trim() || isSubmitting}
                className="flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-[9px] font-semibold text-accent-foreground disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                {isSubmitting ? "Enviando..." : "Responder"}
              </button>
            </div>
          </div>
        )}
      </article>

      {comment.respostas.length > 0 && (
        <ul
          aria-label={`Respostas ao comentário de ${comment.autorNome}`}
          className="mt-2 space-y-2"
        >
          {comment.respostas.map((reply) => (
            <li key={reply.id}>
              <PipelineCommentThread
                comment={reply}
                canReply={canReply}
                replyingToId={replyingToId}
                replyContent={replyContent}
                isSubmitting={isSubmitting}
                depth={depth + 1}
                onStartReply={onStartReply}
                onCancelReply={onCancelReply}
                onReplyContentChange={onReplyContentChange}
                onSubmitReply={onSubmitReply}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
