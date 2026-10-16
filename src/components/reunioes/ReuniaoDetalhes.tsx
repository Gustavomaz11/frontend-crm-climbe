import type { ReactNode } from "react";
import { ExternalLink, Video } from "lucide-react";
import { useReuniaoDetalhes, type PessoaReuniao, type Reuniao } from "@/services/useReunioes";
import { reuniaoCliente, reuniaoDateKey, reuniaoHorario, reuniaoLink, reuniaoStatus } from "./reuniaoPresentation";

const Campo = ({ label, children }: { label: string; children: ReactNode }) => <div className="min-w-0 space-y-1">
  <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
  <dd className="break-words text-sm text-foreground">{children}</dd>
</div>;

const Pessoa = ({ pessoa }: { pessoa: PessoaReuniao }) => <div className="min-w-0">
  <p className="break-words text-sm font-medium">{pessoa.nomeCompleto || pessoa.email || "Nome não informado"}</p>
  {pessoa.nomeCompleto && pessoa.email && <p className="break-all text-xs text-muted-foreground">{pessoa.email}</p>}
</div>;

export const ReuniaoDetalhes = ({ reuniao }: { reuniao: Reuniao }) => {
  const { data, isLoading, error, refetch } = useReuniaoDetalhes(reuniao.id);
  if (reuniao.id > 0 && isLoading) return <p role="status" className="py-10 text-center text-sm text-muted-foreground">Carregando detalhes da reunião...</p>;
  if (reuniao.id > 0 && error) return <div role="alert" className="space-y-3 rounded-xl border border-destructive/20 p-4 text-sm">
    <p>Não foi possível carregar os detalhes da reunião.</p>
    <button type="button" onClick={() => refetch()} className="font-medium text-accent underline">Tentar novamente</button>
  </div>;

  const detalhes = data ?? reuniao;
  const participantes = detalhes.participantes ?? [];
  const linkMeet = reuniaoLink(detalhes.linkMeet);
  const linkGoogle = reuniaoLink(detalhes.googleEventUrl);
  const date = reuniaoDateKey(detalhes);

  return <div className="space-y-6">
    <dl className="grid grid-cols-1 gap-5 rounded-xl border border-border/30 bg-background/40 p-4 sm:grid-cols-2">
      <Campo label="Data">{date ? new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Não informada"}</Campo>
      <Campo label="Horário">{reuniaoHorario(detalhes)}</Campo>
      <Campo label="Tipo">{detalhes.presencial ? "Presencial" : "Virtual"}</Campo>
      <Campo label="Status">{reuniaoStatus(detalhes.status)}</Campo>
      <Campo label="Cliente">{reuniaoCliente(detalhes)}</Campo>
      <Campo label="Local">{detalhes.local || (detalhes.presencial ? "Não informado" : "Google Meet")}</Campo>
      <Campo label="Organizador">{detalhes.organizador ? <Pessoa pessoa={detalhes.organizador} /> : "Não informado"}</Campo>
    </dl>
    <section aria-label="Pauta da reunião" className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pauta</h3>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{detalhes.pauta || detalhes.descricao || "Pauta não informada."}</p>
    </section>
    <section aria-label="Participantes da reunião" className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Participantes ({participantes.length})</h3>
      {participantes.length ? <ul className="grid gap-2 sm:grid-cols-2">{participantes.map((pessoa, index) => <li key={pessoa.id ?? pessoa.email ?? index} className="rounded-lg border border-border/25 bg-background/30 p-3"><Pessoa pessoa={pessoa} /></li>)}</ul>
        : <p className="text-sm text-muted-foreground">Participantes não informados.</p>}
      {detalhes.participantesOmitidos && <p className="text-xs text-muted-foreground">O Google não disponibilizou a lista completa de participantes.</p>}
    </section>
    {(linkMeet || linkGoogle) && <div className="flex flex-wrap gap-3 border-t border-border/20 pt-4">
      {linkMeet && <a href={linkMeet} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground"><Video className="h-4 w-4" />Entrar no Google Meet</a>}
      {linkGoogle && <a href={linkGoogle} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/30 px-4 py-2.5 text-xs font-medium"><ExternalLink className="h-4 w-4" />Abrir no Google Agenda</a>}
    </div>}
  </div>;
};
