import { useId } from "react";
import { getReuniaoError, useSalasReuniao } from "@/services/useReunioes";

interface Props {
  email: string;
  local: string;
  onChange: (email: string, local: string) => void;
}

export const SalaReuniaoSelect = ({ email, local, onChange }: Props) => {
  const id = useId();
  const { data: salas = [], isLoading, error, refetch } = useSalasReuniao(true);

  return <div>
    <label htmlFor={id} className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mb-1.5 block">Sala física</label>
    <select id={id} value={email} disabled={isLoading} onChange={(event) => {
      const sala = salas.find((item) => item.email === event.target.value);
      onChange(event.target.value, sala?.nome ?? "");
    }} className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[13px] outline-none focus:border-accent/40 transition-colors disabled:opacity-45">
      <option value="">{isLoading ? "Carregando salas..." : "Outro local"}</option>
      {email && !salas.some((sala) => sala.email === email) && <option value={email}>{local || email}</option>}
      {salas.map((sala) => <option key={sala.email} value={sala.email}>{sala.nome}</option>)}
    </select>
    {error ? <p role="alert" className="mt-1 text-[11px] text-destructive">{getReuniaoError(error)} <button type="button" onClick={() => refetch()} className="underline">Tentar novamente</button></p>
      : !isLoading && salas.length === 0 && <p className="mt-1 text-[11px] text-muted-foreground">Nenhuma sala física encontrada nos agendamentos acessíveis. Informe o local da reunião abaixo.</p>}
    {email && <p className="mt-1 text-[11px] text-muted-foreground">O nome da sala física será usado como local da reunião.</p>}
  </div>;
};
