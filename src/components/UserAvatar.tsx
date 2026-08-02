import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface UserAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  className?: string;
  initialsClassName?: string;
  openProfileOnClick?: boolean;
}

function getInitials(name?: string | null) {
  const initials = name
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "U";
}

export function UserAvatar({
  name,
  photoUrl,
  className,
  initialsClassName,
  openProfileOnClick = true,
}: UserAvatarProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      aria-label="Abrir meu perfil"
      title="Meu perfil"
      onClick={() => openProfileOnClick && navigate("/perfil")}
      className={cn(
        "flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-accent/20 bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        openProfileOnClick && "cursor-pointer",
        className,
      )}
      whileHover={{ scale: 1.03 }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="Perfil" className="h-full w-full object-cover" />
      ) : (
        <span
          className={cn(
            "text-[11px] font-semibold text-accent",
            initialsClassName,
          )}
        >
          {getInitials(name)}
        </span>
      )}
    </motion.button>
  );
}
