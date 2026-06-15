import type { PropsWithChildren } from "react";
import { createContext, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "@/api";
import { setUnauthorizedCallback } from "@/api";
import { syncGoogleAccessToken } from "@/lib/googleAccessToken";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserRoleStore } from "@/store/useUserRoleStore";
import { jwtDecode } from "jwt-decode";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { toast } from "sonner";

import { useRefreshToken } from "@/hooks/useAuth/useRefreshToken";
import { useSignIn } from "@/hooks/useAuth/useSignIn";
import type { SignInCredentials } from "@/hooks/useAuth/useSignIn";

interface DecodedToken {
  roles: string[];
}

// Variável global para armazenar o timer de refresh
let refreshTokenInterval: NodeJS.Timeout | null = null;
let tokenExpiresAt: number | null = null;

// Função para calcular tempo de expiração
const calculateExpiresAt = (expiresIn: number): number => {
  return Date.now() + expiresIn;
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

    destroyCookie(undefined, "@CLIMB:T");
    destroyCookie(undefined, "@CLIMB:RT");
    destroyCookie(undefined, "email");
    syncGoogleAccessToken(null);
    clearSession();
    clearRole();
    tokenExpiresAt = null;
    navigate("/");
  }, [clearRole, clearSession, navigate]);

  // Função para fazer refresh do token
  const performTokenRefresh = useCallback(async () => {
    try {
      const { "@CLIMB:RT": refreshTokenCookie } = parseCookies();

      if (!refreshTokenCookie) {
        throw new Error("Refresh token não encontrado");
      }

      const response = await refreshToken(refreshTokenCookie);
      const { accessToken, expiresIn } = response;
      const isProduction = process.env.NODE_ENV === "production";

      // Atualizar token no cookie
      setCookie(undefined, "@CLIMB:T", accessToken, {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        secure: isProduction,
        sameSite: "strict",
      });

      // Atualizar header da API
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      // Atualizar tempo de expiração
      tokenExpiresAt = calculateExpiresAt(expiresIn);

      return true;
    } catch {
      // Se refresh falhar, fazer logout
      handleLogout();
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
    setUnauthorizedCallback(async () => {
      return await performTokenRefresh();
    });
  }, [performTokenRefresh]);

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

        const isProduction = process.env.NODE_ENV === "production";

        // Salvar access token
        setCookie(undefined, "@CLIMB:T", accessToken, {
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          secure: isProduction,
          sameSite: "strict",
        });

        // Salvar refresh token em cookie mais seguro
        setCookie(undefined, "@CLIMB:RT", refreshTokenData, {
          maxAge: 60 * 60 * 24 * 7, // 7 dias
          path: "/",
          secure: isProduction,
          sameSite: "strict",
        });

        // Salvar email
        setCookie(undefined, "email", userEmail, {
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          secure: isProduction,
          sameSite: "strict",
        });

        // Atualizar header da API
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

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
