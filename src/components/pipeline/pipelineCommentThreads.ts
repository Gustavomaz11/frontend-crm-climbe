import type { PipelineComentario } from "@/services/usePipelineAtividades";

export interface PipelineCommentNode extends PipelineComentario {
  respostas: PipelineCommentNode[];
}

const sortReplies = (comments: PipelineCommentNode[]) => {
  comments.sort((first, second) => first.criadoEm.localeCompare(second.criadoEm));
  comments.forEach((comment) => sortReplies(comment.respostas));
};

export const buildPipelineCommentThreads = (
  comments: PipelineComentario[],
): PipelineCommentNode[] => {
  const nodes = new Map<number, PipelineCommentNode>(
    comments.map((comment) => [comment.id, { ...comment, respostas: [] }]),
  );
  const roots: PipelineCommentNode[] = [];

  nodes.forEach((comment) => {
    const parent = comment.comentarioPaiId
      ? nodes.get(comment.comentarioPaiId)
      : undefined;
    if (parent && parent.id !== comment.id) {
      parent.respostas.push(comment);
      return;
    }
    roots.push(comment);
  });

  roots.sort((first, second) => second.criadoEm.localeCompare(first.criadoEm));
  roots.forEach((comment) => sortReplies(comment.respostas));
  return roots;
};
