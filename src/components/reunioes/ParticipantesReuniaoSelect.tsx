import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { UserIdentity } from "@/components/users/UserSelect";
import { useUsuarios } from "@/services/useUsuarios";
import type { ReuniaoDisponibilidade } from "@/services/useReuniaoDisponibilidade";
import { DisponibilidadeReuniaoBadge } from "./DisponibilidadeReuniaoBadge";

interface Props {
  value: number[];
  onChange: (ids: number[]) => void;
  disponibilidade?: ReuniaoDisponibilidade["participantes"];
  consultando?: boolean;
  periodoValido?: boolean;
}

export const ParticipantesReuniaoSelect = ({ value, onChange, disponibilidade = [], consultando, periodoValido }: Props) => {
  const [search, setSearch] = useState("");
  const { data: usuarios = [], isLoading, isError } = useUsuarios();
  const filtered = useMemo(() => {
    const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const query = normalize(search.trim());
    return usuarios.filter((usuario) => normalize(`${usuario.nomeCompleto ?? ""} ${usuario.email ?? ""}`).includes(query));
  }, [search, usuarios]);

  return <div>
    <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mb-1.5">Participantes</p>
    <div className="mb-2 flex h-9 items-center gap-2 rounded-lg border border-border/25 bg-background/50 px-3 text-muted-foreground focus-within:border-accent/40">
      <Search className="h-3.5 w-3.5 shrink-0" />
      <input type="text" aria-label="Filtrar participantes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filtrar por nome ou e-mail" className="min-w-0 flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground" />
      {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar filtro de participantes"><X className="h-3 w-3" /></button>}
    </div>
    <div className="max-h-32 overflow-y-auto rounded-lg border border-border/25 bg-background/50 p-2 space-y-1.5">
      {isLoading ? <p className="px-2 py-2 text-[11px] text-muted-foreground">Carregando participantes...</p>
        : isError ? <p role="alert" className="px-2 py-2 text-[11px] text-destructive">Não foi possível carregar os participantes.</p>
        : filtered.length ? filtered.map((usuario) => {
          const obrigatorio = usuario.email?.toLowerCase() === "contato@climbe.com.br";
          return <label key={usuario.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-foreground/75 transition-colors hover:bg-muted/20">
            <input type="checkbox" checked={obrigatorio || value.includes(usuario.id)} disabled={obrigatorio} onChange={(event) => onChange(event.target.checked ? [...value, usuario.id] : value.filter((id) => id !== usuario.id))} className="h-3.5 w-3.5 rounded border-border/40 accent-[hsl(var(--accent))]" />
            <UserIdentity user={usuario} className="min-w-0 flex-1" />
            <DisponibilidadeReuniaoBadge periodoValido={periodoValido} consultando={consultando} disponivel={disponibilidade.find(item => item.id === usuario.id)?.disponivel} />
          </label>;
        }) : <p className="px-2 py-2 text-[11px] text-muted-foreground">Nenhum participante encontrado.</p>}
    </div>
    <p className="mt-1 text-[10px] text-muted-foreground">{value.length ? `${value.length} participante(s) selecionado(s).` : "Selecione os usuários que participarão da reunião."}</p>
  </div>;
};
