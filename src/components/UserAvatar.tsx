import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  className?: string;
  initialsClassName?: string;
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
}: UserAvatarProps) {
  return (
    <motion.div
      className={cn(
        "flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-accent/20 bg-accent/15",
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
    </motion.div>
  );
}
