import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, Calendar as CalendarIcon, Shield, Building2, Settings,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, UserCheck, ArrowLeft,
  CheckCircle2, ScrollText,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { useCreateEmpresa, CreateEmpresaDTO } from "@/services";
import { FileCheck } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: FileText, label: "Contratos", path: "/contratos" },
  { icon: ScrollText, label: "Propostas", path: "/propostas" },
  { icon: CalendarIcon, label: "Agenda", path: "/agenda" },
  { icon: Shield, label: "Permissões", path: "/permissoes" },
  { icon: Building2, label: "Empresas", path: "/empresas" },
  { icon: FileCheck, label: "Documentos", path: "/documentos" },
  { icon: UserCheck, label: "Solicitações", path: "/aprovar-acesso" },
  { icon: Settings, label: "Configurações", path: "/dashboard" },
];

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function InputField({
  label,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-muted-foreground/70 tracking-wide uppercase">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        {...props}
        className="h-9 rounded-lg border border-border/30 bg-background/50 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
      />
    </div>
  );
}

function SelectField({
  label,
  required,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-muted-foreground/70 tracking-wide uppercase">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <select
        {...props}
        className="h-9 rounded-lg border border-border/30 bg-background/50 px-3 text-[13px] text-foreground outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
      >
        {children}
      </select>
    </div>
  );
}

const emptyForm: CreateEmpresaDTO = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  uf: "",
  cep: "",
  telefone: "",
  email: "",
  representanteNome: "",
  representanteCpf: "",
  representanteContato: "",
};

function formatCnpj(v: string) {
  return v.replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatCpf(v: string) {
  return v.replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatCep(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

function formatPhone(v: string) {
  return v.replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4,5})(\d{4})$/, "$1-$2");
}

const CadastroEmpresa = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [form, setForm] = useState<CreateEmpresaDTO>(emptyForm);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const { mutate: createEmpresa, isPending } = useCreateEmpresa();

  function set(field: keyof CreateEmpresaDTO, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createEmpresa(form, {
      onSuccess: () => setSuccess(true),
    });
  }

  const requiredFilled =
    form.razaoSocial &&
    form.cnpj &&
    form.logradouro &&
    form.numero &&
    form.bairro &&
    form.cidade &&
    form.uf &&
    form.cep &&
    form.telefone &&
    form.email &&
    form.representanteNome &&
    form.representanteCpf &&
    form.representanteContato;

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%),
                         radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <motion.aside
          className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}`}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className={`flex items-center h-16 border-b border-border/20 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
            {sidebarCollapsed ? (
              <motion.div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <span className="text-accent font-bold text-xs">C</span>
              </motion.div>
            ) : (
              <ClimbLogo className="h-[16px] text-foreground" />
            )}
          </div>

          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map((item) => (
              <motion.button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 rounded-lg transition-all group relative ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"} ${
                  item.label === "Empresas"
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
                whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {item.label === "Empresas" && (
                  <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" layoutId="activeNav" />
                )}
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!sidebarCollapsed && <span className="text-[13px] font-medium">{item.label}</span>}
              </motion.button>
            ))}
          </nav>

          <div className="border-t border-border/20 py-3 px-2 space-y-1">
            <motion.button
              onClick={() => setIsDark(!isDark)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all ${sidebarCollapsed ? "justify-center" : ""}`}
              whileTap={{ scale: 0.98 }}
            >
              <AnimatePresence mode="wait">
                <motion.div key={isDark ? "s" : "m"} initial={{ opacity: 0, rotate: -30 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 30 }}>
                  {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </motion.div>
              </AnimatePresence>
              {!sidebarCollapsed && <span className="text-[13px] font-medium">{isDark ? "Modo claro" : "Modo escuro"}</span>}
            </motion.button>
            <Link to="/">
              <motion.button
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-all ${sidebarCollapsed ? "justify-center" : ""}`}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-[18px] h-[18px]" />
                {!sidebarCollapsed && <span className="text-[13px] font-medium">Sair</span>}
              </motion.button>
            </Link>
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all shadow-sm"
          >
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </motion.aside>

        {/* Main */}
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"}`}>
          <motion.header
            className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b border-border/20 bg-background/80 backdrop-blur-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              onClick={() => navigate("/empresas")}
              className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Empresas
            </motion.button>

            <motion.div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center">
              <span className="text-accent font-semibold text-[11px]">RR</span>
            </motion.div>
          </motion.header>

          <div className="px-6 pt-6 pb-8 max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-[22px] font-bold text-foreground tracking-tight">Cadastrar Empresa</h1>
              <p className="text-[12px] text-muted-foreground/50 mt-0.5">Preencha os dados para registrar uma nova empresa na plataforma.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Dados da empresa */}
              <motion.div
                className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm p-5 space-y-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <p className="text-[10px] font-semibold text-muted-foreground/50 tracking-[0.1em] uppercase">Dados da Empresa</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <InputField
                      label="Razão Social"
                      required
                      placeholder="Ex: Empresa Ltda."
                      value={form.razaoSocial}
                      onChange={(e) => set("razaoSocial", e.target.value)}
                    />
                  </div>
                  <InputField
                    label="Nome Fantasia"
                    placeholder="Ex: Empresa"
                    value={form.nomeFantasia}
                    onChange={(e) => set("nomeFantasia", e.target.value)}
                  />
                  <InputField
                    label="CNPJ"
                    required
                    placeholder="00.000.000/0000-00"
                    value={form.cnpj}
                    onChange={(e) => set("cnpj", formatCnpj(e.target.value))}
                  />
                </div>
              </motion.div>

              {/* Endereço */}
              <motion.div
                className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm p-5 space-y-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-[10px] font-semibold text-muted-foreground/50 tracking-[0.1em] uppercase">Endereço</p>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <InputField
                      label="CEP"
                      required
                      placeholder="00000-000"
                      value={form.cep}
                      onChange={(e) => set("cep", formatCep(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <InputField
                      label="Logradouro"
                      required
                      placeholder="Rua, Avenida..."
                      value={form.logradouro}
                      onChange={(e) => set("logradouro", e.target.value)}
                    />
                  </div>
                  <InputField
                    label="Número"
                    required
                    placeholder="100"
                    value={form.numero}
                    onChange={(e) => set("numero", e.target.value)}
                  />
                  <div className="col-span-3">
                    <InputField
                      label="Bairro"
                      required
                      placeholder="Nome do bairro"
                      value={form.bairro}
                      onChange={(e) => set("bairro", e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <InputField
                      label="Cidade"
                      required
                      placeholder="Nome da cidade"
                      value={form.cidade}
                      onChange={(e) => set("cidade", e.target.value)}
                    />
                  </div>
                  <SelectField
                    label="UF"
                    required
                    value={form.uf}
                    onChange={(e) => set("uf", e.target.value)}
                  >
                    <option value="">UF</option>
                    {UF_OPTIONS.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </SelectField>
                </div>
              </motion.div>

              {/* Contato */}
              <motion.div
                className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm p-5 space-y-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <p className="text-[10px] font-semibold text-muted-foreground/50 tracking-[0.1em] uppercase">Contato</p>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Telefone"
                    required
                    placeholder="(00) 00000-0000"
                    value={form.telefone}
                    onChange={(e) => set("telefone", formatPhone(e.target.value))}
                  />
                  <InputField
                    label="E-mail"
                    required
                    type="email"
                    placeholder="contato@empresa.com.br"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
              </motion.div>

              {/* Representante Legal */}
              <motion.div
                className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm p-5 space-y-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-[10px] font-semibold text-muted-foreground/50 tracking-[0.1em] uppercase">Representante Legal</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <InputField
                      label="Nome completo"
                      required
                      placeholder="Nome do representante"
                      value={form.representanteNome}
                      onChange={(e) => set("representanteNome", e.target.value)}
                    />
                  </div>
                  <InputField
                    label="CPF"
                    required
                    placeholder="000.000.000-00"
                    value={form.representanteCpf}
                    onChange={(e) => set("representanteCpf", formatCpf(e.target.value))}
                  />
                  <InputField
                    label="Contato"
                    required
                    placeholder="Telefone ou e-mail"
                    value={form.representanteContato}
                    onChange={(e) => set("representanteContato", e.target.value)}
                  />
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                className="flex items-center justify-end gap-3 pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <motion.button
                  type="button"
                  onClick={() => navigate("/empresas")}
                  className="h-9 px-5 rounded-lg border border-border/30 text-[13px] text-muted-foreground hover:text-foreground hover:border-border/60 transition-all"
                  whileTap={{ scale: 0.97 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={!requiredFilled || isPending}
                  className="h-9 px-6 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  whileTap={{ scale: 0.97 }}
                >
                  {isPending ? "Salvando..." : "Cadastrar Empresa"}
                </motion.button>
              </motion.div>
            </form>
          </div>
        </main>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              <div className="rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl p-6 space-y-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">Empresa cadastrada!</h2>
                  <p className="text-[12px] text-muted-foreground/50 mt-1">
                    {form.nomeFantasia || form.razaoSocial} foi registrada com sucesso.
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => { setSuccess(false); setForm(emptyForm); }}
                    className="flex-1 h-9 rounded-lg border border-border/30 text-[12px] text-muted-foreground hover:text-foreground transition-all"
                    whileTap={{ scale: 0.97 }}
                  >
                    Cadastrar outra
                  </motion.button>
                  <motion.button
                    onClick={() => navigate("/empresas")}
                    className="flex-1 h-9 rounded-lg bg-accent text-white text-[12px] font-medium hover:bg-accent/90 transition-all"
                    whileTap={{ scale: 0.97 }}
                  >
                    Ver empresas
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CadastroEmpresa;
