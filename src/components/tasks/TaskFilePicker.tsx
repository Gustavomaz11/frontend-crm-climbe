import { Paperclip, X } from "lucide-react";

export const TaskFilePicker = ({ files, onChange, label, disabled }: {
  files: File[]; onChange: (files: File[]) => void; label: string; disabled?: boolean;
}) => <div className="space-y-2">
  <label className="relative flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/40 px-3 py-2 text-[11px] hover:border-accent/50 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/30">
    <Paperclip className="h-4 w-4 text-accent" />{label}
    <input type="file" multiple disabled={disabled} aria-label={label} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp"
      onChange={(event) => { onChange([...files, ...Array.from(event.target.files || [])]); event.target.value = ""; }} />
  </label>
  {files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded border border-border/20 px-2 py-1 text-[10px]">
    <span className="min-w-0 flex-1 break-all">{file.name}</span><button type="button" disabled={disabled} aria-label={`Remover ${file.name}`} onClick={() => onChange(files.filter((_, current) => current !== index))}><X className="h-3 w-3" /></button>
  </div>)}
  <p className="text-[9px] text-muted-foreground">PDF, documentos Office e imagens.</p>
</div>;
