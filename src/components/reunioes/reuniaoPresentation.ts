import type { Reuniao } from "@/services/useReunioes";

export const reuniaoDateKey = (reuniao: Reuniao) => {
  if (reuniao.data) return reuniao.data;
  const date = new Date(reuniao.dataHora);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const reunioesDoDia = (reunioes: Reuniao[], date: string) => reunioes
  .filter((reuniao) => reuniaoDateKey(reuniao) === date)
  .sort((left, right) => left.dataHora.localeCompare(right.dataHora));

export const reuniaoCliente = (reuniao: Reuniao) => reuniao.empresa?.nome || reuniao.empresa?.nomeFantasia
  || reuniao.empresa?.razaoSocial || (reuniao.empresaId ? `Cliente #${reuniao.empresaId}` : "Reunião da equipe");

export const reuniaoHorario = (reuniao: Reuniao) => {
  if (reuniao.diaInteiro) return "Dia inteiro";
  const format = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Horário não informado" : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };
  const inicio = format(reuniao.dataHora);
  return reuniao.dataHoraFim ? `${inicio} – ${format(reuniao.dataHoraFim)}` : inicio;
};

export const reuniaoStatus = (status?: string) => ({
  AGENDADA: "Agendada", CONFIRMADA: "Confirmada", REALIZADA: "Realizada", CANCELADA: "Cancelada",
  AGENDADO: "Agendada", CONFIRMADO: "Confirmada", REALIZADO: "Realizada", CANCELADO: "Cancelada",
  GOOGLE_CALENDAR: "Google Agenda",
}[status ?? ""] ?? status ?? "Não informado");

export const reuniaoLink = (value?: string | null) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
};
