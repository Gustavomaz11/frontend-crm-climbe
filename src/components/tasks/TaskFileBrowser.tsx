import { useState } from "react";
import { ChevronRight, Folder, FolderOpen, FolderPlus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { FormValidation } from "@/components/ui/form-validation";
import { useAnexarTarefa, useCriarPastaTarefa, type TarefaAnexo, type TarefaPasta, type TarefaTipo } from "@/services/useTarefaColaboracao";
import { TaskAttachmentList } from "./TaskAttachmentList";
import { TaskFilePicker } from "./TaskFilePicker";

export const TaskFileBrowser = ({ tipo, taskId, files, folders }: {
  tipo: TarefaTipo; taskId: number; files: TarefaAnexo[]; folders: TarefaPasta[];
}) => {
  const upload = useAnexarTarefa(tipo, taskId);
  const createFolder = useCriarPastaTarefa(tipo, taskId);
  const [folderId, setFolderId] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const current = folders.find((folder) => folder.id === folderId);
  const pending = upload.isPending || createFolder.isPending;
  const children = folders.filter((folder) => (folder.pastaPaiId ?? null) === folderId);
  const contents = files.filter((file) => (file.pastaId ?? null) === folderId);
  const ancestors: TarefaPasta[] = [];
  let ancestor = current;
  while (ancestor && !ancestors.some((item) => item.id === ancestor?.id)) {
    ancestors.unshift(ancestor);
    ancestor = folders.find((folder) => folder.id === ancestor?.pastaPaiId);
  }
  const navigate = (id: number | null) => { setFolderId(id); setCreating(false); setName(""); setError(""); };
  const addFolder = async () => {
    try {
      setError(""); const folder = await createFolder.mutateAsync({ nome: name.trim(), pastaPaiId: folderId });
      navigate(folder.id); toast.success("Pasta criada.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível criar a pasta."); }
  };
  const sendFiles = async () => {
    try {
      setError(""); const result = await upload.mutateAsync({ files: selectedFiles, pastaId: folderId });
      setSelectedFiles([]);
      if (folderId == null && result[0]?.pastaId != null) setFolderId(result[0].pastaId);
      toast.success("Arquivos anexados à tarefa.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível anexar os arquivos."); }
  };
  return <section className="space-y-3" aria-label="Pastas e arquivos da tarefa">
    <div className="flex items-center justify-between gap-2"><h3 className="text-[12px] font-semibold">Arquivos da tarefa</h3>
      <button type="button" disabled={pending} onClick={() => { setCreating(true); setError(""); }} className="flex items-center gap-1.5 rounded-lg border border-border/30 px-3 py-2 text-[11px] text-accent disabled:opacity-50"><FolderPlus className="h-4 w-4" />{current ? "Nova subpasta" : "Nova pasta"}</button></div>
    <p className="text-[10px] text-muted-foreground">Crie pastas e subpastas para organizar os arquivos. Todas as pessoas que podem visualizar a tarefa têm acesso a eles.</p>
    <nav aria-label="Local dos arquivos" className="flex flex-wrap items-center gap-1 rounded-lg bg-background/40 p-2 text-[11px]">
      <button type="button" disabled={pending} onClick={() => navigate(null)} aria-current={!current ? "page" : undefined} className="rounded px-1 py-1 text-accent hover:bg-accent/10">Arquivos da tarefa</button>
      {ancestors.map((folder) => <span key={folder.id} className="flex min-w-0 items-center gap-1"><ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" /><button type="button" disabled={pending} onClick={() => navigate(folder.id)} aria-current={folder.id === folderId ? "page" : undefined} className="break-all rounded px-1 py-1 text-accent hover:bg-accent/10">{folder.nome}</button></span>)}
    </nav>
    {creating && <FormValidation className="space-y-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
      <label className="block text-[11px]">Nome da pasta *<input required maxLength={120} autoFocus disabled={pending} value={name} onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.closest("[data-form-validation]")?.querySelector<HTMLButtonElement>("[data-validate-submit]")?.click(); } }} className="mt-1 h-9 w-full rounded-lg border border-border/30 bg-background px-3 text-[12px]" /></label>
      <div className="flex gap-2"><button type="button" data-validate-submit disabled={pending} onClick={() => void addFolder()} className="rounded-lg bg-accent px-3 py-2 text-[11px] font-semibold text-accent-foreground disabled:opacity-50">{createFolder.isPending ? "Criando..." : "Criar pasta"}</button><button type="button" disabled={pending} onClick={() => { setCreating(false); setName(""); setError(""); }} className="flex items-center gap-1 px-2 text-[11px]"><X className="h-3 w-3" />Cancelar</button></div>
    </FormValidation>}
    <div className="grid gap-2 sm:grid-cols-2">{children.map((folder) => <button type="button" key={folder.id} disabled={pending} aria-label={`Abrir pasta ${folder.nome}`} onClick={() => navigate(folder.id)} className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/30 p-3 text-left hover:border-accent/50 hover:bg-accent/5 disabled:opacity-50">
      <Folder className="h-6 w-6 shrink-0 text-accent" /><span className="min-w-0 flex-1"><span className="block break-all text-[12px] font-semibold">{folder.nome}</span><span className="mt-1 block text-[10px] text-muted-foreground">{files.filter((file) => file.pastaId === folder.id).length} arquivo(s) · {folders.filter((item) => item.pastaPaiId === folder.id).length} subpasta(s)</span></span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>)}</div>
    <div role="region" aria-label={current ? `Conteúdo da pasta ${current.nome}` : "Arquivos na raiz da tarefa"} className="space-y-3">
      {current && <p className="flex items-center gap-2 text-[11px] font-medium"><FolderOpen className="h-4 w-4 text-accent" />{current.nome}</p>}
      <TaskAttachmentList tipo={tipo} taskId={taskId} files={contents} />
      {!contents.length && !children.length && <p className="text-[11px] text-muted-foreground">{current ? "Nenhum arquivo nesta pasta." : "Nenhum arquivo anexado."}</p>}
      <TaskFilePicker label={current ? `Adicionar arquivos à pasta ${current.nome}` : "Selecionar arquivos para a tarefa"} files={selectedFiles} onChange={setSelectedFiles} disabled={pending} />
      {selectedFiles.length > 0 && <><p className="text-[10px] text-muted-foreground">Destino: {ancestors.length ? ancestors.map((folder) => folder.nome).join(" / ") : "Arquivos da tarefa"}</p><button type="button" disabled={pending} onClick={() => void sendFiles()} className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-[11px] font-semibold text-accent-foreground disabled:opacity-50"><Upload className="h-3.5 w-3.5" />{upload.isPending ? "Enviando..." : "Anexar arquivos"}</button></>}
    </div>
    {error && <p role="alert" className="rounded border border-destructive/30 p-2 text-[11px] text-destructive">{error}</p>}
  </section>;
};
