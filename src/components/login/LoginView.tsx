import type { FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Moon, ShieldCheck, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import InvestmentGraphics from "@/components/login/InvestmentGraphics";
import { FormValidation } from "@/components/ui/form-validation";
import { useTheme } from "@/hooks/use-theme";

interface LoginViewProps {
  email: string;
  password: string;
  showPassword: boolean;
  errorMessage: string;
  isPending: boolean;
  isGooglePending: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onGoogleLogin: () => void;
}

export const LoginView = ({ email, password, showPassword, errorMessage, isPending, isGooglePending,
  onEmailChange, onPasswordChange, onTogglePassword, onSubmit, onGoogleLogin }: LoginViewProps) => {
  const { isDark, setIsDark } = useTheme();
  return (
    <div className="login-page min-h-dvh bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10 lg:px-14">
        <ClimbLogo className="h-5 text-foreground" />
        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />Ambiente restrito
          </span>
          <button type="button" onClick={() => setIsDark(!isDark)} className="app-icon-button"
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}>
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </header>
      <main className="flex items-center px-6 py-8 sm:px-10 lg:px-14">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:gap-24">
          <div className="app-enter mx-auto w-full max-w-[400px]">
            <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">Acesso ao ambiente interno</h1>
            <p className="mb-8 mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Plataforma restrita para operações, análises e gestão patrimonial.
            </p>
            <FormValidation>
              <form noValidate onSubmit={onSubmit} className="space-y-5" aria-busy={isPending || isGooglePending}>
                <div>
                  <label htmlFor="login-email" className="mb-2 block text-sm font-medium">E-mail <span className="text-muted-foreground">*</span></label>
                  <input id="login-email" name="email" type="email" autoComplete="username" inputMode="email" required
                    value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="nome@empresa.com.br" className="login-input" />
                </div>
                <div>
                  <label htmlFor="login-password" className="mb-2 block text-sm font-medium">Senha <span className="text-muted-foreground">*</span></label>
                  <div className="relative">
                    <input id="login-password" name="password" autoComplete="current-password" required
                      type={showPassword ? "text" : "password"} value={password}
                      onChange={(event) => onPasswordChange(event.target.value)} placeholder="••••••••" className="login-input pr-14" />
                    <button type="button" onClick={onTogglePassword} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      aria-pressed={showPassword} aria-controls="login-password"
                      className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                </div>
                {errorMessage && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMessage}</div>}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <Link to="/recuperar-senha" className="login-link">Esqueceu a senha?</Link>
                  <Link to="/solicitar-acesso" className="login-link">Solicitar acesso</Link>
                </div>
                <button type="submit" disabled={isPending || isGooglePending}
                  className="login-submit flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60">
                  {isPending ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Entrando...</>
                    : <>Acessar plataforma<ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
                </button>
                <div className="flex items-center gap-4 py-1 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border/60" /><span>ou</span><span className="h-px flex-1 bg-border/60" />
                </div>
                <button type="button" onClick={onGoogleLogin} disabled={isGooglePending || isPending}
                  className="login-google flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-input bg-card px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
                  {isGooglePending ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Processando...</>
                    : <><GoogleIcon />Continuar com Google</>}
                </button>
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  O login aceita qualquer conta Google. A sincronização da agenda é exclusiva para contas @climbe.com.br.
                </p>
              </form>
            </FormValidation>
          </div>
          <div className="app-enter login-illustration hidden self-stretch border-l border-border/60 pl-12 lg:flex xl:pl-20"><InvestmentGraphics /></div>
        </div>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-2 px-6 py-5 text-[11px] text-muted-foreground sm:px-10 lg:px-14">
        <span>© 2026 Climbe Investimentos Independentes</span><span>v3.1.0</span>
      </footer>
    </div>
  );
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);
