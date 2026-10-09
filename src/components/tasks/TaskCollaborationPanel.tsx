import { useState } from "react";
import { MessageSquare, Reply, Send, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { FormValidation } from "@/components/ui/form-validation";
import { useAnexarTarefa, useComentarTarefa, useTarefaColaboracao, type TarefaComentario, type TarefaTipo } from "@/services/useTarefaColaboracao";
import { TaskAttachmentList } from "./TaskAttachmentList";
import { TaskFilePicker } from "./TaskFilePicker";

export const TaskCollaborationPanel = ({ tipo, taskId }: { tipo: TarefaTipo; taskId: number }) => {
  const { data, isLoading, error, refetch } = useTarefaColaboracao(tipo, taskId);
  const upload = useAnexarTarefa(tipo, taskId);
  const comment = useComentarTarefa(tipo, taskId);
  const [files, setFiles] = useState<File[]>([]);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<TarefaComentario | null>(null);
  const [actionError, setActionError] = useState("");
  const sendFiles = async () => {
    try { setActionError(""); await upload.mutateAsync(files); setFiles([]); toast.success("Arquivos anexados à tarefa."); }
    catch (failure) { setActionError(failure instanceof Error ? failure.message : "Não foi possível anexar os arquivos."); }
  };
  const sendMessage = async () => {
    try {
      setActionError(""); await comment.mutateAsync({ conteudo: message, comentarioPaiId: reply?.id, files: commentFiles });
      setMessage(""); setCommentFiles([]); setReply(null); toast.success("Comentário publicado.");
    } catch (failure) { setActionError(failure instanceof Error ? failure.message : "Não foi possível publicar o comentário."); }
  };
  if (isLoading) return <p className="py-4 text-[11px] text-muted-foreground">Carregando arquivos e comentários...</p>;
  if (error) return <div role="alert" className="rounded-lg border border-destructive/30 p-3 text-[11px] text-destructive">{error.message}<button type="button" onClick={() => void refetch()} className="ml-2 underline">Tentar novamente</button></div>;
  const comments = data?.comentarios || [];
  const renderComment = (item: TarefaComentario, level: number) => <div key={item.id} className={`space-y-2 ${level ? `${level < 4 ? "ml-3 pl-3" : "pl-1"} border-l border-accent/25` : "rounded-lg border border-border/25 p-3"}`}>
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[11px] font-semibold">{item.autor.nomeCompleto}</p><time className="text-[9px] text-muted-foreground">{new Date(item.criadoEm).toLocaleString("pt-BR")}</time></div>
    <p className="whitespace-pre-wrap break-words text-[12px]">{item.conteudo}</p>
    <TaskAttachmentList tipo={tipo} taskId={taskId} files={item.anexos || []} />
    <button type="button" aria-label={`Responder comentário de ${item.autor.nomeCompleto}`} onClick={() => setReply(item)} className="flex items-center gap-1 text-[10px] text-accent"><Reply className="h-3 w-3" />Responder</button>
    {comments.filter((child) => child.comentarioPaiId === item.id).map((child) => renderComment(child, level + 1))}
  </div>;
  return <section className="mt-5 space-y-5 border-t border-border/25 pt-4" aria-label="Arquivos e comentários da tarefa">
    <div className="space-y-3"><h3 className="text-[12px] font-semibold">Arquivos da tarefa</h3><p className="text-[10px] text-muted-foreground">Os arquivos ficam disponíveis para todas as pessoas que podem visualizar esta tarefa.</p>
      <TaskAttachmentList tipo={tipo} taskId={taskId} files={data?.anexos || []} />
      {!data?.anexos.length && <p className="text-[11px] text-muted-foreground">Nenhum arquivo anexado.</p>}
      <TaskFilePicker label="Selecionar arquivos para a tarefa" files={files} onChange={setFiles} disabled={upload.isPending} />
      {!!files.length && <button type="button" disabled={upload.isPending} onClick={() => void sendFiles()} className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-[11px] font-semibold text-accent-foreground disabled:opacity-50"><Upload className="h-3.5 w-3.5" />{upload.isPending ? "Enviando..." : "Anexar arquivos"}</button>}
    </div>
    <div className="space-y-3"><h3 className="flex items-center gap-2 text-[12px] font-semibold"><MessageSquare className="h-4 w-4 text-accent" />Comentários ({comments.length})</h3>
      {comments.filter((item) => !item.comentarioPaiId).map((item) => renderComment(item, 0))}
      {!comments.length && <p className="text-[11px] text-muted-foreground">Comece a conversa sobre esta tarefa.</p>}
      <FormValidation className="space-y-2 rounded-lg border border-border/25 p-3">
        {reply && <div className="flex items-center justify-between rounded bg-accent/10 p-2 text-[10px]"><span>Respondendo a {reply.autor.nomeCompleto}: {reply.conteudo.slice(0, 80)}</span><button type="button" aria-label="Cancelar resposta" onClick={() => setReply(null)}><X className="h-3.5 w-3.5" /></button></div>}
        <label className="block text-[11px] font-medium">{reply ? "Sua resposta" : "Seu comentário"} *<textarea required maxLength={5000} disabled={comment.isPending} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-border/30 bg-background px-3 py-2 text-[12px]" /></label>
        <TaskFilePicker label={reply ? "Anexar arquivos à resposta" : "Anexar arquivos ao comentário"} files={commentFiles} onChange={setCommentFiles} disabled={comment.isPending} />
        <button type="button" data-validate-submit disabled={comment.isPending} onClick={() => void sendMessage()} className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-[11px] font-semibold text-accent-foreground disabled:opacity-50"><Send className="h-3.5 w-3.5" />{comment.isPending ? "Publicando..." : reply ? "Publicar resposta" : "Publicar comentário"}</button>
      </FormValidation>
    </div>
    {actionError && <p role="alert" className="rounded border border-destructive/30 p-2 text-[11px] text-destructive">{actionError}</p>}
  </section>;
};
