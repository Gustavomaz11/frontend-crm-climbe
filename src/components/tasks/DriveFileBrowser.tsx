import { useState } from "react";
import { ChevronRight, Folder, FolderPlus, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { FormValidation } from "@/components/ui/form-validation";
import { useAlterarDrive, useArquivosDrive, useTarefaDrive, type DriveServico } from "@/services/useTarefaDrive";
import { DriveFileList } from "./DriveFileList";
import { TaskFilePicker } from "./TaskFilePicker";

const ServiceFiles = ({ taskId, servico }: { taskId: number; servico: DriveServico }) => {
  const [trail, setTrail] = useState<{ id: string; nome: string }[]>([]);
  const [selected, setSelected] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [actionError, setActionError] = useState("");
  const pastaId = trail.at(-1)?.id ?? null;
  const query = useArquivosDrive(taskId, servico, pastaId);
  const mutation = useAlterarDrive(taskId, servico.servico);
  const pending = mutation.isPending;
  const items = query.data || [];
  const navigate = (index: number) => { setTrail(trail.slice(0, index)); setSelected([]); setCreating(false); setActionError(""); };
  const change = async (folder: boolean) => {
    try {
      setActionError("");
      await mutation.mutateAsync(folder ? { pastaId, nome: name.trim() } : { pastaId, files: selected });
      if (folder) { setCreating(false); setName(""); } else setSelected([]);
      toast.success(folder ? "Pasta criada." : "Arquivos enviados ao Drive.");
    } catch (error) { setActionError(error instanceof Error ? error.message : "Não foi possível salvar no Drive."); }
  };
  if (!servico.pastaId) return <p role="status" className="text-[11px] text-muted-foreground">A pasta deste serviço será disponibilizada após a assinatura e a sincronização do contrato.</p>;
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} onClick={() => setCreating(true)} className="flex items-center gap-1 rounded-lg border border-border/30 px-3 py-2 text-[11px] text-accent"><FolderPlus className="h-4 w-4" />{trail.length ? "Nova subpasta" : "Nova pasta"}</button>
      <button type="button" disabled={query.isFetching || pending} onClick={() => void query.refetch()} className="flex items-center gap-1 text-[11px] text-accent"><RefreshCw className="h-3.5 w-3.5" />Atualizar arquivos</button>
    </div>
    <nav aria-label="Local dos arquivos no Drive" className="flex flex-wrap items-center gap-1 rounded-lg bg-background/40 p-2 text-[11px]">
      <button type="button" disabled={pending} onClick={() => navigate(0)} className="text-accent">{servico.nome}</button>
      {trail.map((folder, index) => <span key={folder.id} className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /><button type="button" disabled={pending} onClick={() => navigate(index + 1)} className="break-all text-accent">{folder.nome}</button></span>)}
    </nav>
    {query.error && <p role="alert" className="text-[11px] text-destructive">{query.error.message}</p>}
    {creating && <FormValidation className="space-y-2 rounded-lg border border-accent/30 p-3">
      <label className="block text-[11px]">Nome da pasta *<input required maxLength={120} value={name} autoFocus disabled={pending} onChange={(event) => setName(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border/30 bg-background px-3 text-[12px]" /></label>
      <button type="button" data-validate-submit disabled={pending} onClick={() => void change(true)} className="rounded-lg bg-accent px-3 py-2 text-[11px] text-accent-foreground">Criar pasta</button>
      <button type="button" disabled={pending} onClick={() => { setCreating(false); setName(""); }} className="ml-2 text-[11px]">Cancelar</button>
    </FormValidation>}
    {query.isLoading && <p className="text-[11px] text-muted-foreground">Carregando arquivos...</p>}
    {items.filter((item) => item.contentType === "application/vnd.google-apps.folder").map((folder) => <button type="button" disabled={pending} key={folder.id} aria-label={`Abrir pasta ${folder.nome}`} onClick={() => { setTrail([...trail, { id: folder.id, nome: folder.nome }]); setSelected([]); setCreating(false); }} className="flex w-full items-center gap-3 rounded-lg border border-border/30 p-3 text-left text-[12px]">
      <Folder className="h-5 w-5 shrink-0 text-accent" /><span className="break-all">{folder.nome}</span><ChevronRight className="ml-auto h-4 w-4 shrink-0" />
    </button>)}
    <DriveFileList taskId={taskId} servico={servico.servico} files={items.filter((item) => item.contentType !== "application/vnd.google-apps.folder")} />
    {!query.isLoading && !query.error && !items.length && <p className="text-[11px] text-muted-foreground">Nenhum arquivo nesta pasta.</p>}
    <TaskFilePicker label="Selecionar arquivos para o serviço" files={selected} onChange={setSelected} disabled={pending || !!query.error} />
    {!!selected.length && <button type="button" disabled={pending || !!query.error} onClick={() => void change(false)} className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-[11px] text-accent-foreground"><Upload className="h-3.5 w-3.5" />{pending ? "Enviando..." : "Enviar ao Drive"}</button>}
    {actionError && <p role="alert" className="text-[11px] text-destructive">{actionError}</p>}
  </div>;
};

export const DriveFileBrowser = ({ taskId }: { taskId: number }) => {
  const query = useTarefaDrive(taskId);
  const [selectedService, setSelectedService] = useState("");
  const services = query.data?.servicos || [];
  const current = services.find((service) => service.servico === selectedService) || services[0];
  return <section aria-label="Pastas e arquivos do serviço" className="space-y-3">
    <h3 className="text-[12px] font-semibold">Arquivos do serviço</h3>
    <p className="text-[10px] text-muted-foreground">Pastas e arquivos compartilhados entre todas as tarefas deste serviço. Alterações no Drive aparecem aqui automaticamente.</p>
    {query.isLoading && <p className="text-[11px] text-muted-foreground">Carregando serviços...</p>}
    {query.error && <p role="alert" className="text-[11px] text-destructive">{query.error.message}<button type="button" onClick={() => void query.refetch()} className="ml-2 underline">Tentar novamente</button></p>}
    {query.data?.mensagem && <p role="status" className="text-[11px] text-muted-foreground">{query.data.mensagem}</p>}
    {services.length > 1 && <label className="block text-[11px]">Serviço contratado<select aria-label="Serviço contratado" value={current?.servico || ""} onChange={(event) => setSelectedService(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border/30 bg-background px-3 text-[12px]">{services.map((service) => <option key={service.servico} value={service.servico}>{service.nome}</option>)}</select></label>}
    {current && <ServiceFiles key={`${taskId}-${current.servico}-${current.pastaId}`} taskId={taskId} servico={current} />}
    {!query.isLoading && !query.error && !services.length && <p className="text-[11px] text-muted-foreground">Este contrato ainda não possui serviços vinculados.</p>}
  </section>;
};
