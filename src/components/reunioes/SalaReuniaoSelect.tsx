import { useId } from "react";
import { getReuniaoError, useSalasReuniao } from "@/services/useReunioes";
import type { ReuniaoDisponibilidade } from "@/services/useReuniaoDisponibilidade";
import { DisponibilidadeReuniaoBadge } from "./DisponibilidadeReuniaoBadge";

interface Props {
  email: string;
  local: string;
  onChange: (email: string, local: string) => void;
  disponibilidade?: ReuniaoDisponibilidade["salas"];
  consultando?: boolean;
  periodoValido?: boolean;
}

export const SalaReuniaoSelect = ({ email, local, onChange, disponibilidade = [], consultando, periodoValido }: Props) => {
  const id = useId();
  const { data: salas = [], isLoading, error, refetch } = useSalasReuniao(true);

  return <div>
    <label htmlFor={id} className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mb-1.5 block">Sala física</label>
    <select id={id} value={email} disabled={isLoading} onChange={(event) => {
      const sala = salas.find((item) => item.email === event.target.value);
      if (sala && (!periodoValido || consultando || disponibilidade.find(item => item.email.toLowerCase() === sala.email.toLowerCase())?.disponivel !== true)) return;
      onChange(event.target.value, sala?.nome ?? "");
    }} className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[13px] outline-none focus:border-accent/40 transition-colors disabled:opacity-45">
      <option value="">{isLoading ? "Carregando salas..." : "Outro local"}</option>
      {email && !salas.some((sala) => sala.email === email) && <option value={email} disabled>{local || email} — Não verificada</option>}
      {salas.map((sala) => {
        const livre = disponibilidade.find(item => item.email.toLowerCase() === sala.email.toLowerCase())?.disponivel;
        const status = !periodoValido ? "Informe data e horários" : consultando ? "Verificando..." : livre === true ? "Disponível" : livre === false ? "Ocupada" : "Não verificada";
        return <option key={sala.email} value={sala.email} disabled={!periodoValido || consultando || livre !== true}>{sala.nome} — {status}</option>;
      })}
    </select>
    {error ? <p role="alert" className="mt-1 text-[11px] text-destructive">{getReuniaoError(error)} <button type="button" onClick={() => refetch()} className="underline">Tentar novamente</button></p>
      : !isLoading && salas.length === 0 && <p className="mt-1 text-[11px] text-muted-foreground">Nenhuma sala física encontrada nos agendamentos acessíveis. Informe o local da reunião abaixo.</p>}
    {email && <div className="mt-2 flex items-center gap-2"><DisponibilidadeReuniaoBadge sala periodoValido={periodoValido} consultando={consultando} disponivel={disponibilidade.find(item => item.email.toLowerCase() === email.toLowerCase())?.disponivel} /><p className="text-[11px] text-muted-foreground">Disponibilidade durante todo o período da reunião.</p></div>}
  </div>;
};
