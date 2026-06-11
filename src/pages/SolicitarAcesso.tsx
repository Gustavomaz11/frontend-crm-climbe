import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Moon, Sun, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { setCookie } from "nookies";
import { toast } from "sonner";
import ClimbLogo from "@/components/login/ClimbLogo";
import { useTheme } from "@/hooks/use-theme";
import {
  useGoogleAuthUrl,
  useExchangeGoogleCode,
} from "@/hooks/useAuth/useGoogleAuth";
import { syncGoogleAccessToken } from "@/lib/googleAccessToken";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserRoleStore } from "@/store/useUserRoleStore";

const SolicitarAcesso = () => {
  const { isDark, setIsDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    empresa: "",
    cargo: "",
  });

  const setBasicUserData = useAuthStore((state) => state.setBasicUserData);
  const setRole = useUserRoleStore((state) => state.setRole);
  const { mutateAsync: getGoogleAuthUrl, isPending: isLoadingGoogleUrl } =
    useGoogleAuthUrl();
  const { mutateAsync: exchangeGoogleCode, isPending: isExchangingCode } =
    useExchangeGoogleCode();

  const handleGoogleCallback = useCallback(
    async (code: string) => {
      try {
        const response = await exchangeGoogleCode(code);

        if (!response.success) {
          toast.error(response.message);
          return;
        }

        const { data } = response;

        // Salvar dados do usuário para o PrivateRoute funcionar
        setBasicUserData({
          id: data.usuario.id,
          email: data.usuario.email,
          nomeCompleto: data.usuario.nomeCompleto,
        });

        if (data.pendingToken) {
          // Primeiro acesso: salvar pendingToken e cargoId para completar o cadastro
          sessionStorage.setItem("@CLIMB:PENDING_TOKEN", data.pendingToken);
          sessionStorage.setItem(
            "@CLIMB:PENDING_CARGO_ID",
            String(data.usuario.cargoId ?? 0)
          );
          toast.success(`Bem-vindo, ${data.usuario.nomeCompleto}! Complete seu cadastro.`);
          navigate("/first-access");
          return;
        }

        // Login normal: salvar tokens
        setCookie(null, "@CLIMB:T", data.accessToken, {
          maxAge: data.expiresIn,
          path: "/",
        });

        setCookie(null, "@CLIMB:RT", data.refreshToken, {
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });

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

  const handleGoogleLogin = async () => {
    try {
      const { authorizationUrl } = await getGoogleAuthUrl();
      window.location.href = authorizationUrl;
    } catch {
      toast.error("Erro ao iniciar autenticação com Google");
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      <motion.div
        className="fixed top-[-25%] right-[-15%] w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 60%)",
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed bottom-[-25%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 60%)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="fixed inset-0 pointer-events-none opacity-[0.01] dark:opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.42) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.42) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative z-10 min-h-screen grid grid-rows-[auto_1fr_auto]">
        <header className="flex items-center justify-between px-6 md:px-10 lg:px-14 py-5">
          <ClimbLogo className="h-4 text-foreground" />
          <motion.button
            onClick={() => setIsDark(!isDark)}
            className="w-7 h-7 rounded border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all duration-200"
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
                  <Sun className="w-3 h-3" />
                ) : (
                  <Moon className="w-3 h-3" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </header>

        <main className="flex items-center justify-center px-6 md:px-10 lg:px-14">
          <div className="w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-accent transition-colors duration-200 mb-8"
              >
                <ArrowLeft className="w-3 h-3" />
                Voltar ao acesso
              </Link>

              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h1 className="text-[1.8rem] md:text-[2rem] font-semibold tracking-[-0.03em] text-foreground leading-[1.08] mb-3">
                      Solicitar
                      <br />
                      <span className="text-accent">acesso</span>
                    </h1>
                    <p className="text-sm text-muted-foreground/60 leading-relaxed mb-10 max-w-[340px]">
                      Envie seus dados corporativos para análise de liberação ao
                      ambiente interno.
                    </p>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setSubmitted(true);
                      }}
                      className="space-y-4"
                    >
                      {[
                        {
                          id: "nome",
                          label: "Nome completo",
                          placeholder: "Seu nome",
                        },
                        {
                          id: "email",
                          label: "E-mail corporativo",
                          placeholder: "nome@empresa.com.br",
                        },
                        {
                          id: "empresa",
                          label: "Empresa",
                          placeholder: "Nome da empresa",
                        },
                        {
                          id: "cargo",
                          label: "Cargo",
                          placeholder: "Seu cargo",
                        },
                      ].map((field) => (
                        <div key={field.id}>
                          <label className="text-[11px] font-medium text-muted-foreground/70 mb-1.5 block tracking-wide">
                            {field.label}
                          </label>
                          <div className="relative">
                            <input
                              type={field.id === "email" ? "email" : "text"}
                              value={form[field.id as keyof typeof form]}
                              onChange={(e) =>
                                setForm((current) => ({
                                  ...current,
                                  [field.id]: e.target.value,
                                }))
                              }
                              onFocus={() => setFocusedField(field.id)}
                              onBlur={() => setFocusedField(null)}
                              placeholder={field.placeholder}
                              className="w-full h-11 rounded-md border border-input bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/15 transition-all duration-200"
                            />
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-accent origin-left"
                              initial={{ scaleX: 0 }}
                              animate={{
                                scaleX: focusedField === field.id ? 1 : 0,
                              }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ))}

                      <motion.button
                        type="submit"
                        className="w-full h-11 rounded-md bg-accent text-accent-foreground text-sm font-semibold flex items-center justify-center gap-2 group relative overflow-hidden"
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Enviar solicitação
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
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
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-full border border-accent/30 flex items-center justify-center mb-6"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.2, type: "spring" }}
                    >
                      <motion.svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5 text-accent"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <motion.path
                          d="M5 13l4 4L19 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                        />
                      </motion.svg>
                    </motion.div>

                    <h1 className="text-[1.6rem] font-semibold tracking-[-0.03em] text-foreground leading-[1.08] mb-3">
                      Solicitação
                      <br />
                      <span className="text-accent">enviada</span>
                    </h1>
                    <p className="text-sm text-muted-foreground/60 leading-relaxed mb-8 max-w-[340px]">
                      Recebemos o pedido para{" "}
                      <span className="text-foreground font-medium">
                        {form.email}
                      </span>
                      . O time interno fará a validação e retornará em breve.
                    </p>

                    <Link
                      to="/"
                      className="inline-flex items-center gap-1.5 text-[11px] text-accent hover:text-accent/80 transition-colors duration-200 font-medium"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Voltar ao acesso
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </main>

        <footer className="flex items-center justify-between px-6 md:px-10 lg:px-14 py-5">
          <span className="text-[9px] text-muted-foreground/25 tracking-wide">
            © 2026 Climb Investimentos Independentes
          </span>
          <span className="text-[9px] text-muted-foreground/25 font-mono">
            v3.1.0
          </span>
        </footer>
      </div>
    </div>
  );
};

export default SolicitarAcesso;
