import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Moon, Sun, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import { setCookie } from "nookies";
import { toast } from "sonner";

import ClimbLogo from "@/components/login/ClimbLogo";
import InvestmentGraphics from "@/components/login/InvestmentGraphics";
import { useTheme } from "@/hooks/use-theme";

import { useSignIn } from "@/hooks/useAuth/useSignIn";
import {
  useGoogleAuthUrl,
  useExchangeGoogleCode,
} from "@/hooks/useAuth/useGoogleAuth";
import { syncGoogleAccessToken } from "@/lib/googleAccessToken";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserRoleStore } from "@/store/useUserRoleStore";

const Index = () => {
  const { isDark, setIsDark } = useTheme();
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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleCallback = useCallback(
    async (code: string) => {
      try {
        const response = await exchangeGoogleCode(code);

        if (!response.success) {
          toast.error(response.message);
          return;
        }

        const { data } = response;

        // Salvar tokens
        setCookie(null, "@CLIMB:T", data.accessToken, {
          maxAge: data.expiresIn,
          path: "/",
        });

        setCookie(null, "@CLIMB:RT", data.refreshToken, {
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });

        // Salvar dados do usuário
        setBasicUserData({
          id: data.usuario.id,
          email: data.usuario.email,
          nomeCompleto: data.usuario.nomeCompleto,
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

    if (googleOauth === "success" && code) {
      handleGoogleCallback(code);
    } else if (googleOauth === "error") {
      toast.error(`Erro: ${errorMsg || "Falha na autenticação"}`);
    }
  }, [searchParams, handleGoogleCallback]);

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

      setCookie(null, "@CLIMB:T", response.accessToken, {
        maxAge: response.expiresIn,
        path: "/",
      });

      setCookie(null, "@CLIMB:RT", response.refreshToken, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      setBasicUserData({
        id: response.usuario?.id,
        email: response.usuario?.email,
        nomeCompleto: response.usuario?.nomeCompleto,
      });

      const possibleRole =
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-500">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      <motion.div
        className="pointer-events-none fixed right-[-15%] top-[-25%] h-[800px] w-[800px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 60%)",
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none fixed bottom-[-25%] left-[-10%] h-[600px] w-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 60%)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.01] dark:opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.42) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.42) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative z-10 grid min-h-screen grid-rows-[auto_1fr_auto]">
        <header className="flex items-center justify-between px-6 py-5 md:px-10 lg:px-14">
          <ClimbLogo className="h-4 text-foreground" />

          <div className="flex items-center gap-3">
            <motion.div
              className="hidden items-center gap-1.5 rounded-full border border-border/40 px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50 md:flex"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <span className="h-1 w-1 animate-pulse rounded-full bg-accent" />
              Ambiente restrito
            </motion.div>

            <motion.button
              onClick={() => setIsDark(!isDark)}
              className="flex h-7 w-7 items-center justify-center rounded border border-border/50 text-muted-foreground transition-all duration-200 hover:border-border hover:text-foreground"
              aria-label="Alternar tema"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? "sun" : "moon"}
                  initial={{ opacity: 0, rotate: -30 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 30 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? (
                    <Sun className="h-3 w-3" />
                  ) : (
                    <Moon className="h-3 w-3" />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </header>

        <main className="flex items-center px-6 md:px-10 lg:px-14">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-0 lg:grid-cols-[420px_1px_1fr] xl:grid-cols-[460px_1px_1fr]">
            <div className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none lg:pr-14 xl:pr-20">
              <div className="mb-6 lg:hidden">
                <ClimbLogo className="h-4 text-foreground" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <h1 className="mb-3 text-[2rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground md:text-[2.4rem]">
                  Acesso ao ambiente
                  <br />
                  <span className="text-accent">interno</span>
                </h1>

                <p className="mb-10 max-w-[340px] text-sm leading-relaxed text-muted-foreground/60">
                  Plataforma restrita para operações, análises e gestão
                  patrimonial.
                </p>
              </motion.div>

              <motion.form
                onSubmit={handleLogin}
                className="space-y-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              >
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground/70">
                    E-mail corporativo
                  </label>

                  <div className="group relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="nome@climb.com.br"
                      className="h-11 w-full rounded-md border border-input bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 transition-all duration-200 focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/15"
                    />

                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-[2px] origin-left rounded-full bg-accent"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: focusedField === "email" ? 1 : 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground/70">
                    Senha
                  </label>

                  <div className="group relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-md border border-input bg-background px-3.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/30 transition-all duration-200 focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/15"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 transition-colors hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-[2px] origin-left rounded-full bg-accent"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: focusedField === "password" ? 1 : 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
                    {errorMessage}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Link
                    to="/recuperar-senha"
                    className="text-[10px] text-muted-foreground/50 transition-colors duration-200 hover:text-accent"
                  >
                    Esqueceu a senha?
                  </Link>

                  <Link
                    to="/solicitar-acesso"
                    className="text-[10px] text-muted-foreground/50 transition-colors duration-200 hover:text-accent"
                  >
                    Solicitar acesso
                  </Link>
                </div>

                <motion.button
                  type="submit"
                  disabled={isPending}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-accent text-sm font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-70"
                  whileHover={{ scale: isPending ? 1 : 1.005 }}
                  whileTap={{ scale: isPending ? 1 : 0.995 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-accent"
                    whileHover={
                      isPending
                        ? undefined
                        : {
                            background: [
                              "hsl(var(--accent))",
                              "hsl(var(--accent) / 0.85)",
                              "hsl(var(--accent))",
                            ],
                          }
                    }
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />

                  <span className="relative z-10 flex items-center gap-2">
                    {isPending ? "Entrando..." : "Acessar plataforma"}
                    {!isPending && (
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    )}
                  </span>
                </motion.button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/40" />
                  </div>

                  <div className="relative flex justify-center">
                    <span className="bg-background px-3 text-[9px] uppercase tracking-wider text-muted-foreground/30">
                      ou
                    </span>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoadingGoogleUrl || isExchangingCode}
                  className="flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-border/50 bg-background text-sm font-medium text-foreground transition-colors duration-200 hover:border-border hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={
                    isLoadingGoogleUrl || isExchangingCode
                      ? {}
                      : { scale: 1.005 }
                  }
                  whileTap={
                    isLoadingGoogleUrl || isExchangingCode
                      ? {}
                      : { scale: 0.995 }
                  }
                >
                  {isLoadingGoogleUrl || isExchangingCode ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continuar com Google
                    </>
                  )}
                </motion.button>
              </motion.form>
            </div>

            <div className="my-16 hidden w-px self-stretch bg-border/40 lg:block" />

            <div className="hidden pl-14 lg:block xl:pl-20">
              <InvestmentGraphics />
            </div>
          </div>
        </main>

        <footer className="flex items-center justify-between px-6 py-5 md:px-10 lg:px-14">
          <motion.span
            className="text-[9px] tracking-wide text-muted-foreground/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            © 2026 Climb Investimentos Independentes
          </motion.span>

          <motion.span
            className="font-mono text-[9px] text-muted-foreground/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            v3.1.0
          </motion.span>
        </footer>
      </div>
    </div>
  );
};

export default Index;
