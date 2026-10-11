import { useState } from "react";
import { Archive, ArchiveRestore, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getKanbanArquivoError, useAlterarArquivamentoKanban, useKanbanArquivados, type KanbanArquivoContexto } from "@/services/useKanbanArquivos";

export const KanbanArquivarButton = ({ contexto, id, titulo }: { contexto: KanbanArquivoContexto; id: number; titulo: string }) => {
  const mutation = useAlterarArquivamentoKanban();
  return <button type="button" aria-label={`Arquivar ${titulo}`} disabled={mutation.isPending}
    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground disabled:opacity-50"
    onClick={async (event) => {
      event.stopPropagation();
      try { await mutation.mutateAsync({ contexto, id, arquivado: true }); toast.success("Item arquivado"); }
      catch (error) { toast.error(getKanbanArquivoError(error)); }
    }}><Archive className="h-3.5 w-3.5" />{mutation.isPending ? "Arquivando..." : "Arquivar"}</button>;
};

export const KanbanArquivados = <T,>({ contexto, canRestore, onOpen }: {
  contexto: KanbanArquivoContexto;
  canRestore: boolean;
  onOpen?: (item: T) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: items = [], isLoading, error, refetch } = useKanbanArquivados<T>(contexto, open);
  const mutation = useAlterarArquivamentoKanban();
  const filtered = items.filter((item) => `${item.titulo} ${item.coluna} ${item.responsaveis || ""}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")))
    .sort((a, b) => b.arquivadoEm.localeCompare(a.arquivadoEm));

  return <AlertDialog open={open} onOpenChange={(value) => { if (!mutation.isPending) { setOpen(value); if (!value) setSearch(""); } }}>
    <AlertDialogTrigger asChild><button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/30 bg-card/40 px-3 text-xs font-medium hover:border-accent/50"><Archive className="h-4 w-4" />Arquivados</button></AlertDialogTrigger>
    <AlertDialogContent className="flex max-h-[90dvh] flex-col gap-4 sm:max-w-4xl">
      <AlertDialogHeader><AlertDialogTitle>Arquivados</AlertDialogTitle><AlertDialogDescription>
        Itens concluídos, ganhos e perdidos são arquivados após 15 dias. Ao desarquivar, o item volta à coluna anterior e terá mais 15 dias antes do próximo arquivamento.
      </AlertDialogDescription></AlertDialogHeader>
      <label className="flex items-center gap-2 rounded-lg border border-border/30 px-3"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label="Buscar itens arquivados" placeholder="Buscar por título, coluna ou responsável" value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
      <div className="min-h-0 overflow-y-auto">
        {isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando arquivados...</p>
          : error ? <div className="py-8 text-center text-sm"><p>Não foi possível carregar os arquivados.</p><button type="button" onClick={() => void refetch()} className="mt-2 text-accent underline">Tentar novamente</button></div>
          : filtered.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum item arquivado encontrado.</p>
          : <ul className="space-y-2">{filtered.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/25 bg-background/40 p-4">
            <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{item.titulo}</p><p className="mt-1 text-xs text-muted-foreground">{item.coluna}{item.responsaveis ? ` · ${item.responsaveis}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">Arquivado em {new Date(item.arquivadoEm).toLocaleString("pt-BR")}</p></div>
            <div className="flex shrink-0 gap-2">{onOpen && <button type="button" disabled={mutation.isPending} onClick={() => { setOpen(false); onOpen(item.item); }} className="rounded-lg border border-border/30 px-3 py-2 text-xs">Abrir</button>}
              {canRestore && <button type="button" aria-label={`Desarquivar ${item.titulo}`} disabled={mutation.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50" onClick={async () => {
                try { await mutation.mutateAsync({ contexto, id: item.id, arquivado: false }); toast.success("Item desarquivado e devolvido à coluna anterior"); }
                catch (restoreError) { toast.error(getKanbanArquivoError(restoreError)); }
              }}><ArchiveRestore className="h-3.5 w-3.5" />{mutation.isPending && mutation.variables?.id === item.id ? "Desarquivando..." : "Desarquivar"}</button>}
            </div>
          </li>)}</ul>}
      </div>
      <AlertDialogFooter><AlertDialogCancel disabled={mutation.isPending}>Fechar</AlertDialogCancel></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
};
