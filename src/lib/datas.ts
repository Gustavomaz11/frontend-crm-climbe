const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const DATA_HORA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})?$/i;

export const possuiHorario = (value: string) => DATA_HORA_ISO.test(value);
export const ehDataIso = (value: string) => DATA_ISO.test(value) || possuiHorario(value);

const interpretarData = (value: string) => {
  if (!ehDataIso(value)) return null;
  const comFuso = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  // Datas civis e LocalDateTime não devem mudar de dia conforme o fuso do navegador.
  const date = new Date(DATA_ISO.test(value) ? `${value}T00:00:00Z` : comFuso ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (!comFuso && date.toISOString().slice(0, 10) !== value.slice(0, 10)) return null;
  return { date, timeZone: comFuso ? "America/Sao_Paulo" : "UTC" };
};

export const formatarData = (value?: string | null): string => {
  if (!value) return "Não informado";
  const parsed = interpretarData(value);
  if (!parsed) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: parsed.timeZone,
    ...(possuiHorario(value) ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const } : {}),
  }).format(parsed.date);
};

export const dataParaInput = (value: string): string => {
  const parsed = interpretarData(value);
  if (!parsed) return "";
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23", timeZone: parsed.timeZone,
  }).formatToParts(parsed.date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value;
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  return possuiHorario(value) ? `${date}T${part("hour")}:${part("minute")}:${part("second")}` : date;
};
