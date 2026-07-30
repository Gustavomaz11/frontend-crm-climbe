export type CommercialService =
  | "BPO"
  | "CFO"
  | "CONTABILIDADE"
  | "VALUATION"
  | "FINANCE_SUPPORT"
  | "CONSORCIO"
  | "DESENVOLVIMENTO_SOFTWARE";

export const SERVICE_OPTIONS: Array<{ value: CommercialService; label: string }> = [
  { value: "BPO", label: "BPO" },
  { value: "CFO", label: "CFO" },
  { value: "CONTABILIDADE", label: "Contabilidade" },
  { value: "VALUATION", label: "Valuation" },
  { value: "FINANCE_SUPPORT", label: "Finance Support" },
  { value: "CONSORCIO", label: "Consórcio" },
  { value: "DESENVOLVIMENTO_SOFTWARE", label: "Desenvolvimento de Software" },
];

const RECURRING_SERVICES = new Set<CommercialService>([
  "BPO", "CFO", "CONTABILIDADE", "FINANCE_SUPPORT", "DESENVOLVIMENTO_SOFTWARE",
]);

export const isRecurringService = (service?: CommercialService | null) =>
  Boolean(service && RECURRING_SERVICES.has(service));

export const getServiceLabel = (service?: CommercialService | null) =>
  SERVICE_OPTIONS.find((item) => item.value === service)?.label ?? "Serviço não informado";
