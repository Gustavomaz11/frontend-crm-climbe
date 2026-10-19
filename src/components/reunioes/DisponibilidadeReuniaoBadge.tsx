export interface DisponibilidadeProps {
  disponivel?: boolean | null;
  consultando?: boolean;
  periodoValido?: boolean;
}

export const DisponibilidadeReuniaoBadge = ({ disponivel, consultando, periodoValido, sala = false }: DisponibilidadeProps & { sala?: boolean }) => {
  const label = !periodoValido ? "Informe data e horários" : consultando ? "Verificando..."
    : disponivel === true ? "Disponível" : disponivel === false ? sala ? "Ocupada" : "Ocupado" : "Não verificada";
  const cor = periodoValido && !consultando && disponivel === true ? "bg-accent/10 text-accent"
    : periodoValido && !consultando && disponivel === false ? "bg-destructive/10 text-destructive" : "bg-muted/30 text-muted-foreground";
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${cor}`}>{label}</span>;
};
