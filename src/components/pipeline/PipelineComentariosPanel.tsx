import { useMemo, useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { toast } from "sonner";
import {
  useCreatePipelineComentario,
  usePipelineComentarios,
} from "@/services/usePipelineAtividades";
import { PipelineCommentThread } from "./PipelineCommentThread";
import {
  buildPipelineCommentThreads,
  type PipelineCommentNode,
} from "./pipelineCommentThreads";

interface PipelineComentariosPanelProps {
  negocioId: number;
  canView: boolean;
  canCreate: boolean;
}

export const PipelineComentariosPanel = ({
  negocioId,
  canView,
  canCreate,
}: PipelineComentariosPanelProps) => {
  const [content, setContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { data: comments = [], isLoading } = usePipelineComentarios(negocioId, canView);
  const createComment = useCreatePipelineComentario();
  const threads = useMemo(() => buildPipelineCommentThreads(comments), [comments]);

  const submit = async (conteudo: string, comentarioPaiId?: number) => {
    const trimmed = conteudo.trim();
    if (!trimmed) return;

    try {
      await createComment.mutateAsync({ negocioId, conteudo: trimmed, comentarioPaiId });
      if (comentarioPaiId) {
        setReplyingToId(null);
        setReplyContent("");
        toast.success("Resposta incluída");
        return;
      }
      setContent("");
      toast.success("Comentário incluído");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao incluir comentário");
    }
  };

  const startReply = (comment: PipelineCommentNode) => {
    setReplyingToId(comment.id);
    setReplyContent("");
  };

  const cancelReply = () => {
    setReplyingToId(null);
    setReplyContent("");
  };

  if (!canView) {
    return (
      <div className="rounded-xl border border-border/25 bg-muted/10 p-8 text-center text-[11px] text-muted-foreground">
        Você não possui permissão para visualizar os comentários comerciais.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[13px] font-semibold">Comentários e observações</h3>
        <p className="mt-0.5 text-[10px] text-muted-foreground/50">
          Registre decisões e informações relevantes da negociação.
        </p>
      </div>

      {canCreate && (
        <div className="rounded-xl border border-border/25 bg-background/35 p-3">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Escreva um comentário..."
            className="min-h-20 w-full resize-none bg-transparent text-[11px] leading-relaxed outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => void submit(content)}
              disabled={!content.trim() || createComment.isPending}
              className="flex h-8 items-center gap-2 rounded-lg bg-accent px-3 text-[10px] font-semibold text-accent-foreground disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              {createComment.isPending ? "Enviando..." : "Comentar"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="py-8 text-center text-[11px] text-muted-foreground">Carregando comentários...</p>
      ) : (
        <div className="space-y-3">
          {threads.map((comment) => (
            <PipelineCommentThread
              key={comment.id}
              comment={comment}
              canReply={canCreate}
              replyingToId={replyingToId}
              replyContent={replyContent}
              isSubmitting={createComment.isPending}
              onStartReply={startReply}
              onCancelReply={cancelReply}
              onReplyContentChange={setReplyContent}
              onSubmitReply={(replyTo) => void submit(replyContent, replyTo.id)}
            />
          ))}
          {threads.length === 0 && (
            <div className="py-10 text-center">
              <MessageSquareText className="mx-auto h-5 w-5 text-muted-foreground/30" />
              <p className="mt-2 text-[10px] text-muted-foreground/45">Nenhum comentário registrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
