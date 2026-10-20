import { UserAvatar } from "@/components/UserAvatar";
import { NotificationBell } from "@/components/NotificationBell";
import { AppMobileNavigation } from "@/components/layout/AppMobileNavigation";
import { useAuthStore } from "@/store/useAuthStore";

export function AppHeaderUser({ name, photoUrl, role }: {
  name?: string | null; photoUrl?: string | null; role?: string | null;
}) {
  const basicUserData = useAuthStore(state => state.basicUserData);
  const userData = useAuthStore(state => state.userData);
  const userName = name || basicUserData?.nomeCompleto || userData?.nomeCompleto || userData?.pessoa?.nomeCompleto || "Usuário";
  const userRole = role || basicUserData?.cargoNome || userData?.cargo || "Cargo não informado";
  const userPhoto = photoUrl || basicUserData?.fotoPerfil || userData?.fotoPerfil || userData?.pessoa?.fotoPerfil || null;

  return <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
    <AppMobileNavigation />
    <div className="max-w-[110px] min-w-0 text-right sm:max-w-[180px] lg:max-w-[240px]">
      <p title={userName} className="truncate text-[12px] font-semibold text-foreground">{userName}</p>
      <p title={userRole} className="truncate text-[10px] text-muted-foreground">{userRole}</p>
    </div>
    <NotificationBell />
    <UserAvatar name={userName} photoUrl={userPhoto} />
  </div>;
}
