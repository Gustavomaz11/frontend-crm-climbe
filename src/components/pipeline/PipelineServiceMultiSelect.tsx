import { useId } from "react";
import { Check, X } from "lucide-react";

interface PipelineServiceMultiSelectProps {
  options: readonly string[];
  value: string[];
  disabled: boolean;
  onChange: (services: string[]) => void;
}

const selectClass = "h-10 w-full rounded-lg border border-border/30 bg-background/70 px-3 text-[12px] text-foreground outline-none transition-colors focus:border-accent/45 disabled:cursor-not-allowed disabled:opacity-60";

export const PipelineServiceMultiSelect = ({
  options,
  value,
  disabled,
  onChange,
}: PipelineServiceMultiSelectProps) => {
  const labelId = useId();
  const availableOptions = options.filter((option) => !value.includes(option));

  const addService = (service: string) => {
    if (!service || value.includes(service)) return;
    onChange([...value, service]);
  };

  const removeService = (service: string) => {
    onChange(value.filter((item) => item !== service));
  };

  return (
    <div>
      <span id={labelId} className="mb-1.5 block text-[11px] font-medium text-foreground/70">
        Serviços de interesse
      </span>
      <select
        value=""
        onChange={(event) => addService(event.target.value)}
        disabled={disabled || availableOptions.length === 0}
        className={selectClass}
        aria-labelledby={labelId}
      >
        <option value="">
          {availableOptions.length === 0 ? "Todos os serviços foram selecionados" : "Adicionar serviço"}
        </option>
        {availableOptions.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <div className="mt-2 flex min-h-7 flex-wrap gap-1.5" aria-label="Serviços selecionados">
        {value.length === 0 && <span className="text-[10px] text-muted-foreground">Nenhum serviço selecionado.</span>}
        {value.map((service) => (
          <span key={service} className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 py-1 pl-2.5 pr-1 text-[10px] font-medium text-accent">
            <Check className="h-3 w-3" />
            {service}
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeService(service)}
              aria-label={`Remover ${service}`}
              className="rounded-full p-0.5 transition hover:bg-accent/20 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};
