import type { PropsWithChildren } from "react";
import { createContext, useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { setUnauthorizedCallback } from "@/api";
import { syncGoogleAccessToken } from "@/lib/googleAccessToken";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  clearLegacyAuthStorage,
  saveAccessToken,
  saveRefreshToken,
} from "@/lib/authCookies";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserRoleStore } from "@/store/useUserRoleStore";
import { jwtDecode } from "jwt-decode";
import { isAxiosError } from "axios";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { toast } from "sonner";

import { useRefreshToken } from "@/hooks/useAuth/useRefreshToken";
import { useSignIn } from "@/hooks/useAuth/useSignIn";
import type { SignInCredentials } from "@/hooks/useAuth/useSignIn";

interface DecodedToken {
  roles?: string[];
  exp?: number;
}

// Variável global para armazenar o timer de refresh
let refreshTokenInterval: NodeJS.Timeout | null = null;
let tokenExpiresAt: number | null = null;

// Função para calcular tempo de expiração
const calculateExpiresAt = (expiresIn: number): number => {
  return Date.now() + expiresIn;
};

const readTokenExpiresAt = (accessToken: string): number | null => {
  try {
    const { exp } = jwtDecode<DecodedToken>(accessToken);
    return exp ? exp * 1000 : null;
  } catch {
    return null;
  }
};

// Função para verificar se o token está perto de expirar (5 minutos antes)
const isTokenNearExpiration = (): boolean => {
  if (!tokenExpiresAt) return false;
  const timeUntilExpiration = tokenExpiresAt - Date.now();
  const fiveMinutesInMs = 5 * 60 * 1000;
  return timeUntilExpiration <= fiveMinutesInMs;
};

export interface AuthContextProps {
  handleSignIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  isPending: boolean;
}

export const AuthContext = createContext<AuthContextProps | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();

  const { mutateAsync: signIn, isPending } = useSignIn();
  const { mutateAsync: refreshToken } = useRefreshToken();
  const { clearSession, setBasicUserData } = useAuthStore();
  const { setRole, clearRole } = useUserRoleStore();

  // Função para fazer logout (extraída para reutilização)
  const handleLogout = useCallback(() => {
    // Limpar timer
    if (refreshTokenInterval) {
      clearInterval(refreshTokenInterval);
      refreshTokenInterval = null;
    }

    clearAuthCookies();
    clearLegacyAuthStorage();
    destroyCookie(undefined, "email");
    syncGoogleAccessToken(null);
    clearSession();
    clearRole();
    tokenExpiresAt = null;
    navigate("/");
  }, [clearRole, clearSession, navigate]);

  // Função para fazer refresh do token
  const performTokenRefresh = useCallback(async () => {
    const refreshTokenCookie = parseCookies()[REFRESH_TOKEN_COOKIE];
    if (!refreshTokenCookie) {
      handleLogout();
      return false;
    }

    try {
      const response = await refreshToken(refreshTokenCookie);
      const { accessToken, expiresIn } = response;

      saveAccessToken(accessToken, expiresIn);

      // Atualizar tempo de expiração
      tokenExpiresAt = calculateExpiresAt(expiresIn);

      return true;
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status && [400, 401, 403].includes(status)) {
        handleLogout();
      }
      return false;
    }
  }, [refreshToken, handleLogout]);

  // Função para iniciar o timer de refresh automático
  const setupRefreshTimer = useCallback(() => {
    // Limpar timer anterior se existir
    if (refreshTokenInterval) {
      clearInterval(refreshTokenInterval);
    }

    // Verificar a cada 30 segundos se o token precisa ser renovado
    refreshTokenInterval = setInterval(async () => {
      if (isTokenNearExpiration()) {
        await performTokenRefresh();
      }
    }, 30 * 1000); // 30 segundos
  }, [performTokenRefresh]);

  // Configurar callback para 401
  useEffect(() => {
    clearLegacyAuthStorage();
  }, []);

  useEffect(() => {
    setUnauthorizedCallback(async () => {
      return await performTokenRefresh();
    });
  }, [performTokenRefresh]);

  useEffect(() => {
    const cookies = parseCookies();
    const accessToken = cookies[ACCESS_TOKEN_COOKIE];
    const refreshTokenCookie = cookies[REFRESH_TOKEN_COOKIE];

    if (accessToken) {
      tokenExpiresAt = readTokenExpiresAt(accessToken);
      setupRefreshTimer();

      if (isTokenNearExpiration() && refreshTokenCookie) {
        void performTokenRefresh();
      }
      return;
    }

    if (refreshTokenCookie && location.pathname !== "/") {
      void performTokenRefresh();
    }
  }, [location.pathname, performTokenRefresh, setupRefreshTimer]);

  const handleSignIn = useCallback(
    async ({ email, senha }: SignInCredentials) => {
      try {
        const data = await signIn({ email, senha });
        const {
          accessToken,
          refreshToken: refreshTokenData,
          expiresIn,
          usuario,
          googleAccessToken,
        } = data;

        syncGoogleAccessToken(googleAccessToken);

        // Email vem em data.usuario.email
        const userEmail = usuario?.email || email;

        saveAccessToken(accessToken, expiresIn);
        saveRefreshToken(refreshTokenData);

        // Salvar email
        setCookie(undefined, "email", userEmail, {
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          secure: window.location.protocol === "https:",
          sameSite: "strict",
        });

        tokenExpiresAt = calculateExpiresAt(expiresIn);

        // Decodificar JWT para pegar roles
        const decoded = jwtDecode<DecodedToken>(accessToken);
        const role = decoded.roles?.[0]?.toUpperCase();
        setRole(role);

        // Salvar dados do usuário no store
        if (usuario) {
          setBasicUserData(usuario);
        }

        // Iniciar timer de refresh automático
        setupRefreshTimer();

        // Navegar diretamente para dashboard (dados já estão salvos)
        navigate("/dashboard");
      } catch {
        toast.error("Email ou senha inválidos");
      }
    },
    [signIn, setRole, setBasicUserData, setupRefreshTimer, navigate],
  );

  const signOut = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  const cachedValue = useMemo(() => {
    return {
      handleSignIn,
      isPending,
      signOut,
    };
  }, [handleSignIn, isPending, signOut]);

  return (
    <AuthContext.Provider value={cachedValue}>{children}</AuthContext.Provider>
  );
}
