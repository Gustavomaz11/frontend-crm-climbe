import { UserAvatar } from "@/components/UserAvatar";
import { NotificationBell } from "@/components/NotificationBell";
import { AppMobileNavigation } from "@/components/layout/AppMobileNavigation";

export function AppHeaderUser({ name, photoUrl }: { name?: string | null; photoUrl?: string | null }) {
  return <div className="flex shrink-0 items-center gap-2 sm:gap-3"><AppMobileNavigation /><NotificationBell /><UserAvatar name={name} photoUrl={photoUrl} /></div>;
}
