import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export const TaskDialogShell = ({ children, label, labelledBy, onClose, closeDisabled = false }: {
  children: ReactNode;
  label?: string;
  labelledBy?: string;
  onClose: () => void;
  closeDisabled?: boolean;
}) => createPortal(
  <div role="dialog" aria-modal="true" aria-label={label} aria-labelledby={labelledBy} className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
    <button type="button" aria-label="Fechar janela da tarefa" disabled={closeDisabled} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
    <div data-task-dialog-surface className="relative z-10 flex h-full min-h-0 w-full min-w-0 flex-col overflow-clip rounded-2xl border border-border/30 bg-card shadow-2xl">
      {children}
    </div>
  </div>, document.body,
);
