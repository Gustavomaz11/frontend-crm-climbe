export type ReviewAnnotationSource = "document" | "comment";

export const reviewAnnotationKey = (id?: number, localId?: string) => localId || String(id);

export const reviewAnnotationMarkId = (key: string) => `review-annotation-mark-${key}`;

export const reviewAnnotationCommentId = (key: string) => `review-annotation-comment-${key}`;

export const revealRelatedReviewAnnotation = (key: string, source: ReviewAnnotationSource) => {
  const targetId = source === "comment"
    ? reviewAnnotationMarkId(key)
    : reviewAnnotationCommentId(key);

  window.requestAnimationFrame(() => {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  });
};
