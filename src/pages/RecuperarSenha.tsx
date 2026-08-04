import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { useTheme } from "@/hooks/use-theme";

const RecuperarSenha = () => {
  const { isDark, setIsDark } = useTheme();
  const [email, setEmail] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
        style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 60%)" }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed bottom-[-25%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 60%)" }}
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
                {isDark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
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
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-accent transition-colors duration-200 mb-8"
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
                      Recuperar
                      <br />
                      <span className="text-accent">senha</span>
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-[320px]">
                      Informe o e-mail corporativo associado à sua conta para receber o link de redefinição.
                    </p>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setSubmitted(true);
                      }}
                      className="space-y-5"
                    >
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block tracking-wide">
                          E-mail corporativo
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="nome@climbe.com.br"
                            className="w-full h-11 rounded-md border border-input bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/15 transition-all duration-200"
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-accent origin-left"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focusedField === "email" ? 1 : 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        className="w-full h-11 rounded-md bg-accent text-accent-foreground text-sm font-semibold flex items-center justify-center gap-2 group relative overflow-hidden"
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Enviar link de redefinição
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </span>
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
                      Link
                      <br />
                      <span className="text-accent">enviado</span>
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-[320px]">
                      Se o e-mail <span className="text-foreground font-medium">{email}</span> estiver cadastrado, você receberá as instruções de redefinição em instantes.
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
          <span className="text-[9px] text-muted-foreground tracking-wide">
            © 2026 Climbe Investimentos Independentes
          </span>
          <span className="text-[9px] text-muted-foreground font-mono">
            v3.1.0
          </span>
        </footer>
      </div>
    </div>
  );
};

export default RecuperarSenha;
