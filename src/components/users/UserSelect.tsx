import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY_VALUE = "__sem_usuario__";

export interface UserSelectOption {
  id: number;
  nomeCompleto: string;
  cargo?: string | null;
  cargoNome?: string | null;
  fotoPerfil?: string | null;
}

interface UserIdentityProps {
  user: UserSelectOption;
  className?: string;
  avatarClassName?: string;
}

interface UserSelectProps {
  users: UserSelectOption[];
  value?: string | number | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
}

export function getUserRole(user: UserSelectOption) {
  return user.cargoNome?.trim() || user.cargo?.trim() || "Sem cargo informado";
}

export function UserIdentity({
  user,
  className,
  avatarClassName,
}: UserIdentityProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Avatar className={cn("h-8 w-8 border border-accent/20 bg-accent/10", avatarClassName)}>
        {user.fotoPerfil && (
          <AvatarImage
            src={user.fotoPerfil}
            alt={`Foto de ${user.nomeCompleto}`}
            className="object-cover"
          />
        )}
        <AvatarFallback className="bg-accent/10 text-[9px] font-semibold text-accent">
          {getInitials(user.nomeCompleto)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 text-left leading-tight">
        <span className="block truncate text-[11px] font-medium text-foreground">
          {user.nomeCompleto}
        </span>
        <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
          {getUserRole(user)}
        </span>
      </span>
    </span>
  );
}

export function UserSelect({
  users,
  value,
  onValueChange,
  placeholder = "Selecione um usuário",
  emptyLabel = "Sem responsável",
  allowEmpty = true,
  disabled = false,
  className,
  ariaLabel,
}: UserSelectProps) {
  const normalizedValue = value === null || value === undefined || value === ""
    ? EMPTY_VALUE
    : String(value);
  const selectedUser = users.find((user) => String(user.id) === normalizedValue);

  return (
    <Select
      value={normalizedValue}
      disabled={disabled}
      onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_VALUE ? "" : nextValue)}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "h-12 border-border/30 bg-background/60 px-2.5 py-1 text-foreground focus:ring-accent/30 [&>span]:line-clamp-none",
          className,
        )}
      >
        {selectedUser ? (
          <UserIdentity user={selectedUser} avatarClassName="h-7 w-7" />
        ) : (
          <span className="truncate text-[11px] text-muted-foreground">{placeholder}</span>
        )}
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {allowEmpty && (
          <SelectItem value={EMPTY_VALUE} className="min-h-10 py-2 text-[11px]">
            {emptyLabel}
          </SelectItem>
        )}
        {users.map((user) => (
          <SelectItem key={user.id} value={String(user.id)} className="min-h-12 py-1.5">
            <UserIdentity user={user} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
