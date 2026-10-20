import { useEffect, useState } from "react";
import { Download, Eye, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { baixarArquivoDrive, type DriveArquivo } from "@/services/useTarefaDrive";

export const DriveFileList = ({ taskId, servico, files }: { taskId: number; servico: string; files: DriveArquivo[] }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; file: DriveArquivo } | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const open = async (file: DriveArquivo, download: boolean) => {
    const visualizavel = file.contentType === "application/pdf" || file.contentType.startsWith("image/") && !file.contentType.includes("svg");
    if (!download && !visualizavel && file.webViewLink) {
      try {
        const url = new URL(file.webViewLink);
        if (url.protocol === "https:" && ["drive.google.com", "docs.google.com"].includes(url.hostname)) {
          window.open(url.href, "_blank", "noopener,noreferrer"); return;
        }
      } catch { /* Um link inválido usa o download autenticado. */ }
    }
    setBusy(file.id);
    try {
      const response = await baixarArquivoDrive(taskId, servico, file);
      const url = URL.createObjectURL(response.data);
      if (!download && visualizavel) { setPreview({ url, file }); return; }
      const link = document.createElement("a"); link.href = url;
      const extension = file.contentType === "application/vnd.google-apps.document" ? ".docx"
        : file.contentType === "application/vnd.google-apps.spreadsheet" ? ".xlsx"
        : file.contentType === "application/vnd.google-apps.presentation" ? ".pptx" : "";
      link.download = file.nome + extension; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível abrir o arquivo."); }
    finally { setBusy(null); }
  };
  return <>
    {files.map((file) => <div key={file.id} className="flex items-center gap-2 rounded-lg border border-border/25 p-2.5">
      <FileText className="h-4 w-4 shrink-0 text-accent" /><span className="min-w-0 flex-1 break-all text-[11px]">{file.nome}</span>
      <button type="button" disabled={busy !== null} aria-label={`Abrir ${file.nome}`} onClick={() => void open(file, false)} className="rounded p-2 text-accent disabled:opacity-50"><Eye className="h-4 w-4" /></button>
      <button type="button" disabled={busy !== null} aria-label={`Baixar ${file.nome}`} onClick={() => void open(file, true)} className="rounded p-2 text-accent disabled:opacity-50"><Download className="h-4 w-4" /></button>
    </div>)}
    {preview && <div role="dialog" aria-modal="true" aria-label={`Visualizar ${preview.file.nome}`} className="fixed inset-0 z-[100] flex flex-col bg-background p-4">
      <div className="mb-3 flex justify-between gap-3"><p className="truncate text-sm font-semibold">{preview.file.nome}</p><button type="button" aria-label="Fechar visualização" onClick={() => setPreview(null)} className="rounded border border-border/30 p-2"><X className="h-4 w-4" /></button></div>
      {preview.file.contentType.startsWith("image/") ? <img src={preview.url} alt={preview.file.nome} className="min-h-0 flex-1 object-contain" /> : <iframe src={preview.url} title={preview.file.nome} className="min-h-0 w-full flex-1 rounded-lg border border-border/30" />}
    </div>}
  </>;
};
