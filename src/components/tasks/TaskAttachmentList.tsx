import { useEffect, useState } from "react";
import { Download, Eye, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { baixarAnexoTarefa, type TarefaAnexo, type TarefaTipo } from "@/services/useTarefaColaboracao";

export const TaskAttachmentList = ({ tipo, taskId, files }: { tipo: TarefaTipo; taskId: number; files: TarefaAnexo[] }) => {
  const [busy, setBusy] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ url: string; file: TarefaAnexo } | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const open = async (file: TarefaAnexo, download: boolean) => {
    setBusy(file.id);
    try {
      const blob = await baixarAnexoTarefa(tipo, taskId, file);
      const url = URL.createObjectURL(new Blob([blob], { type: file.contentType }));
      if (!download) { setPreview({ url, file }); return; }
      const link = document.createElement("a"); link.href = url; link.download = file.nome; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível abrir o arquivo."); }
    finally { setBusy(null); }
  };
  return <>
    <div className="space-y-2">{files.map((file) => <div key={file.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/25 bg-background/30 p-2.5">
      <FileText className="h-4 w-4 shrink-0 text-accent" />
      <div className="min-w-0 flex-1"><p className="break-all text-[11px] font-medium">{file.nome}</p><p className="text-[9px] text-muted-foreground">{(file.tamanho / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB · {file.autor.nomeCompleto}</p></div>
      {(file.contentType === "application/pdf" || file.contentType.startsWith("image/")) && <button type="button" disabled={busy !== null} aria-label={`Visualizar ${file.nome}`} onClick={() => void open(file, false)} className="rounded p-2 text-accent hover:bg-accent/10 disabled:opacity-50"><Eye className="h-4 w-4" /></button>}
      <button type="button" disabled={busy !== null} aria-label={`Baixar ${file.nome}`} onClick={() => void open(file, true)} className="rounded p-2 text-accent hover:bg-accent/10 disabled:opacity-50"><Download className="h-4 w-4" /></button>
    </div>)}</div>
    {preview && <div role="dialog" aria-modal="true" aria-label={`Visualizar ${preview.file.nome}`} className="fixed inset-0 z-[100] flex flex-col bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{preview.file.nome}</p><button type="button" aria-label="Fechar visualização" onClick={() => setPreview(null)} className="rounded border border-border/30 p-2"><X className="h-4 w-4" /></button></div>
      {preview.file.contentType.startsWith("image/") ? <img src={preview.url} alt={preview.file.nome} className="min-h-0 flex-1 object-contain" /> : <iframe src={preview.url} title={preview.file.nome} className="min-h-0 w-full flex-1 rounded-lg border border-border/30" />}
    </div>}
  </>;
};
