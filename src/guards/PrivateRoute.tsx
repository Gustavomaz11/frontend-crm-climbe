import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { parseCookies } from "nookies";
import { useAuthStore } from "@/store/useAuthStore";
import { ACCESS_TOKEN_COOKIE } from "@/lib/authCookies";

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { basicUserData } = useAuthStore();
  const localToken = localStorage.getItem(ACCESS_TOKEN_COOKIE);
  const cookies = parseCookies();
  const cookieToken = cookies[ACCESS_TOKEN_COOKIE];

  const isAuthenticated = Boolean(basicUserData || localToken || cookieToken);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
