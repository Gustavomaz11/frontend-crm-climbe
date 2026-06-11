import { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Moon,
  Sun,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { setCookie } from "nookies";
import ClimbLogo from "@/components/login/ClimbLogo";
import { useTheme } from "@/hooks/use-theme";
import { useCompleteRegistration } from "@/hooks/useAuth/useGoogleAuth";
import { useUserRoleStore } from "@/store/useUserRoleStore";

const FirstAccess = () => {
  const { isDark, setIsDark } = useTheme();
  const navigate = useNavigate();
  const setRole = useUserRoleStore((state) => state.setRole);
  const { mutateAsync: completeRegistration, isPending } = useCompleteRegistration();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cpf: "",
    contato: "",
    senha: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validar CPF (formato básico)
  const isValidCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, "");
    return cleanCPF.length === 11;
  };

  // Validar contato (email ou telefone)
  const isValidContact = (contact: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(?:\(\d{2}\)|\d{2})?\s?9?\d{4}-?\d{4}$/;
    return emailRegex.test(contact) || phoneRegex.test(contact);
  };

  // Validar senha
  const isValidPassword = (password: string) => {
    return password.length >= 8;
  };

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length <= 3) return cleanValue;
    if (cleanValue.length <= 6)
      return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
    if (cleanValue.length <= 9)
      return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9, 11)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cpf") {
      formattedValue = formatCPF(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));

    // Limpar erro do campo quando começar a digitar
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!isValidCPF(formData.cpf)) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }

    if (!formData.contato.trim()) {
      newErrors.contato = "Contato é obrigatório";
    } else if (!isValidContact(formData.contato)) {
      newErrors.contato = "Email ou telefone inválido";
    }

    if (!formData.senha.trim()) {
      newErrors.senha = "Senha é obrigatória";
    } else if (!isValidPassword(formData.senha)) {
      newErrors.senha = "Senha deve ter no mínimo 8 caracteres";
    }

    if (formData.senha !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não correspondem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const pendingToken = sessionStorage.getItem("@CLIMB:PENDING_TOKEN");
    const cargoId = Number(sessionStorage.getItem("@CLIMB:PENDING_CARGO_ID") ?? 0);

    if (!pendingToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      navigate("/solicitar-acesso");
      return;
    }

    try {
      const response = await completeRegistration({
        pendingToken,
        cpf: formData.cpf.replace(/\D/g, ""),
        contato: formData.contato,
        senha: formData.senha,
        cargoId,
      });

      setCookie(null, "@CLIMB:T", response.data.accessToken, {
        maxAge: 60 * 60 * 8,
        path: "/",
      });

      setCookie(null, "@CLIMB:RT", response.data.refreshToken, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      setRole(response.data.usuario.cargoNome || "USER");

      sessionStorage.removeItem("@CLIMB:PENDING_TOKEN");
      sessionStorage.removeItem("@CLIMB:PENDING_CARGO_ID");

      toast.success("Cadastro completado com sucesso!");
      navigate("/dashboard");
    } catch {
      toast.error("Erro ao completar o cadastro. Tente novamente.");
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      {/* Animated background elements */}
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

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-8 md:p-12">
        <div className="w-32">
          <ClimbLogo />
        </div>

        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-lg hover:bg-accent transition-colors duration-300"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-accent" />
          ) : (
            <Moon className="w-5 h-5 text-accent" />
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <motion.div
          className="w-full max-w-md px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="space-y-8">
            {/* Title */}
            <motion.div
              className="text-center space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Bem-vindo!
              </h1>
              <p className="text-lg text-muted-foreground">
                Complete seu cadastro para começar
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {/* CPF */}
              <div className="space-y-2">
                <label
                  htmlFor="cpf"
                  className="text-sm font-medium text-foreground"
                >
                  CPF
                </label>
                <div
                  className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                    focusedField === "cpf"
                      ? "border-accent bg-accent/5"
                      : "border-border"
                  } ${errors.cpf ? "border-red-500" : ""}`}
                >
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField("cpf")}
                    onBlur={() => setFocusedField(null)}
                    maxLength={14}
                    className="w-full px-4 py-2.5 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                  />
                </div>
                {errors.cpf && (
                  <p className="text-xs text-red-500">{errors.cpf}</p>
                )}
              </div>

              {/* Contato */}
              <div className="space-y-2">
                <label
                  htmlFor="contato"
                  className="text-sm font-medium text-foreground"
                >
                  Email ou Telefone
                </label>
                <div
                  className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                    focusedField === "contato"
                      ? "border-accent bg-accent/5"
                      : "border-border"
                  } ${errors.contato ? "border-red-500" : ""}`}
                >
                  <input
                    type="text"
                    id="contato"
                    name="contato"
                    placeholder="seu@email.com ou (11) 99999-9999"
                    value={formData.contato}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField("contato")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-2.5 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                  />
                </div>
                {errors.contato && (
                  <p className="text-xs text-red-500">{errors.contato}</p>
                )}
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label
                  htmlFor="senha"
                  className="text-sm font-medium text-foreground"
                >
                  Senha
                </label>
                <div
                  className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                    focusedField === "senha"
                      ? "border-accent bg-accent/5"
                      : "border-border"
                  } ${errors.senha ? "border-red-500" : ""}`}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    id="senha"
                    name="senha"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.senha}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField("senha")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-2.5 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-xs text-red-500">{errors.senha}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-foreground"
                >
                  Confirmar Senha
                </label>
                <div
                  className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                    focusedField === "confirmPassword"
                      ? "border-accent bg-accent/5"
                      : "border-border"
                  } ${errors.confirmPassword ? "border-red-500" : ""}`}
                >
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Repita sua senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-2.5 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isPending}
                className="w-full mt-6 bg-accent hover:bg-accent/90 text-white font-medium py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Completando cadastro...
                  </>
                ) : (
                  <>
                    Completar Cadastro
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* Info Box */}
            <motion.div
              className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80">
                Suas informações estão seguras. Usaremos dados seguros conforme
                a LGPD.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FirstAccess;
