import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface PendingRegistrationClaims {
  type?: string;
  pendingId?: number;
  exp?: number;
}

export function PendingRegistrationRoute({ children }: { children: ReactNode }) {
  const token = sessionStorage.getItem("@CLIMB:PENDING_TOKEN");
  if (!token) return <Navigate to="/" replace />;

  try {
    const claims = jwtDecode<PendingRegistrationClaims>(token);
    if (claims.type !== "pending_registration" || !claims.pendingId
      || !claims.exp || claims.exp * 1000 <= Date.now()) {
      return <Navigate to="/" replace />;
    }
  } catch {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
