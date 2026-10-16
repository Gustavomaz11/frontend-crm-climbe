import { LoginView } from "@/components/login/LoginView";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { useSignIn } from "@/hooks/useAuth/useSignIn";
import {
  useGoogleAuthUrl,
  useExchangeGoogleCode,
} from "@/hooks/useAuth/useGoogleAuth";
import { syncGoogleAccessToken } from "@/lib/googleAccessToken";
import { saveAccessToken, saveRefreshToken } from "@/lib/authCookies";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserRoleStore } from "@/store/useUserRoleStore";
import { preloadRoute } from "@/routes/lazyPages";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { mutateAsync: signIn, isPending } = useSignIn();
  const { mutateAsync: getGoogleAuthUrl, isPending: isLoadingGoogleUrl } =
    useGoogleAuthUrl();
  const { mutateAsync: exchangeGoogleCode, isPending: isExchangingCode } =
    useExchangeGoogleCode();

  const setBasicUserData = useAuthStore((state) => state.setBasicUserData);
  const setRole = useUserRoleStore((state) => state.setRole);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const preloadTimer = window.setTimeout(() => preloadRoute("/dashboard"), 800);
    return () => window.clearTimeout(preloadTimer);
  }, []);

  const handleGoogleCallback = useCallback(
    async (code: string) => {
      try {
        const response = await exchangeGoogleCode(code);

        if (!response.success) {
          toast.error(response.message);
          return;
        }

        const { data } = response;

        saveAccessToken(data.accessToken, data.expiresIn);
        saveRefreshToken(data.refreshToken);

        // Salvar dados do usuário
        setBasicUserData({
          id: data.usuario.id,
          email: data.usuario.email,
          nomeCompleto: data.usuario.nomeCompleto,
          fotoPerfil: data.usuario.fotoPerfil,
          cargoNome: data.usuario.cargoNome,
        });

        // Salvar role
        setRole(data.usuario.cargoNome || "USER");

        syncGoogleAccessToken(data.googleAccessToken);

        toast.success(`Bem-vindo, ${data.usuario.nomeCompleto}!`);
        navigate("/dashboard");
      } catch {
        toast.error("Erro ao processar login com Google");
      }
    },
    [exchangeGoogleCode, setBasicUserData, setRole, navigate],
  );

  // Handler para callback do Google OAuth
  useEffect(() => {
    const code = searchParams.get("code");
    const googleOauth = searchParams.get("google_oauth");
    const errorMsg = searchParams.get("message");
    const email = searchParams.get("email");

    if (googleOauth === "success" && code) {
      handleGoogleCallback(code);
    } else if (googleOauth === "completar_cadastro" && code) {
      exchangeGoogleCode(code)
        .then((response) => {
          const pendingToken = response.data.accessToken;
          if (!pendingToken) {
            toast.error("Token de cadastro invalido.");
            return;
          }

          sessionStorage.setItem("@CLIMB:PENDING_TOKEN", pendingToken);
          syncGoogleAccessToken(response.data.googleAccessToken);
          setBasicUserData({
            email: email ?? undefined,
            nomeCompleto: email ?? "Usuario Google",
          });
          navigate("/first-access");
        })
        .catch(() => toast.error("Erro ao processar cadastro Google"));
    } else if (googleOauth === "pending_approval") {
      if (email) {
        sessionStorage.setItem("@CLIMB:PENDING_EMAIL", email);
      }
      navigate("/pending-approval");
    } else if (googleOauth === "not_linked") {
      toast.error("Conta Google ainda nao vinculada. Tente novamente ou use login por e-mail e senha.");
    } else if (googleOauth === "error") {
      toast.error(`Erro: ${errorMsg || "Falha na autenticação"}`);
    }
  }, [searchParams, handleGoogleCallback, exchangeGoogleCode, setBasicUserData, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Preencha e-mail e senha.");
      return;
    }

    try {
      const response = await signIn({
        email: email.trim(),
        senha: password,
      });

      if (!response?.accessToken || !response?.refreshToken) {
        setErrorMessage("Resposta de login inválida.");
        return;
      }

      saveAccessToken(response.accessToken, response.expiresIn);
      saveRefreshToken(response.refreshToken);

      setBasicUserData({
        id: response.usuario?.id,
        email: response.usuario?.email,
        nomeCompleto: response.usuario?.nomeCompleto,
        fotoPerfil: response.usuario?.fotoPerfil,
        cargoNome: response.usuario?.cargoNome,
      });

      const possibleRole =
        response.usuario?.cargoNome ||
        (response.usuario as { cargo?: string; role?: string } | undefined)
          ?.cargo ||
        (response.usuario as { cargo?: string; role?: string } | undefined)
          ?.role;

      if (possibleRole) {
        setRole(possibleRole);
      }

      syncGoogleAccessToken(response.googleAccessToken);

      navigate("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;

      const apiMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Não foi possível entrar. Verifique suas credenciais.";

      setErrorMessage(apiMessage);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const data = await getGoogleAuthUrl();
      window.location.href = data.authorizationUrl;
    } catch {
      toast.error("Erro ao iniciar login com Google");
    }
  };

  return <LoginView email={email} password={password} showPassword={showPassword}
    errorMessage={errorMessage} isPending={isPending} isGooglePending={isLoadingGoogleUrl || isExchangingCode}
    onEmailChange={setEmail} onPasswordChange={setPassword} onTogglePassword={() => setShowPassword(!showPassword)}
    onSubmit={handleLogin} onGoogleLogin={handleGoogleLogin} />;
};

export default Index;
