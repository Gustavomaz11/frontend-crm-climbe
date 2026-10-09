import { useState } from "react";
import { UserIdentity, type UserSelectOption } from "./UserSelect";

interface Props {
  users: UserSelectOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const UserMultiSelect = ({ users, value, onChange, label = "Responsáveis", required, disabled }: Props) => {
  const [search, setSearch] = useState("");
  const selected = users.filter((user) => value.includes(user.id));
  return <div role="group" aria-label={label} tabIndex={-1} data-field-label={label}
    data-required-value={required && !disabled ? value.join(",") : undefined}
    className="rounded-lg border border-border/30 bg-background/50 p-2">
    <p className="mb-2 text-[11px] font-medium">{label}{required ? " *" : ""} · {value.length} selecionado(s)</p>
    {selected.length > 0 && <p className="mb-2 break-words text-[10px] text-accent">{selected.map((user) => user.nomeCompleto).join(", ")}</p>}
    <input aria-label={`Buscar ${label.toLowerCase()}`} value={search} onChange={(event) => setSearch(event.target.value)}
      placeholder="Buscar pessoa" disabled={disabled} className="mb-2 h-8 w-full rounded border border-border/20 bg-background px-2 text-[11px]" />
    <div className="max-h-36 space-y-1 overflow-y-auto">
      {users.filter((user) => user.nomeCompleto.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map((user) =>
        <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-muted/20">
          <input type="checkbox" checked={value.includes(user.id)} disabled={disabled} aria-label={`Atribuir ${user.nomeCompleto}`}
            onChange={(event) => onChange(event.target.checked ? [...value, user.id] : value.filter((id) => id !== user.id))} />
          <UserIdentity user={user} className="min-w-0 flex-1" />
        </label>)}
      {!users.length && <p className="text-[10px] text-muted-foreground">Nenhuma pessoa disponível.</p>}
    </div>
  </div>;
};
