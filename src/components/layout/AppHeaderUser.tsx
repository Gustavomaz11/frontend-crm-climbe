import { UserAvatar } from "@/components/UserAvatar";
import { NotificationBell } from "@/components/NotificationBell";

export function AppHeaderUser({ name, photoUrl }: { name?: string | null; photoUrl?: string | null }) {
  return <div className="flex shrink-0 items-center gap-3"><NotificationBell /><UserAvatar name={name} photoUrl={photoUrl} /></div>;
}
