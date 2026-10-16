import { AppMain } from "@/components/layout/AppMain";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { FormValidation } from "@/components/ui/form-validation";
import { useEffect, useRef, useState } from "react";

import { useSidebarState } from "@/hooks/useSidebarState";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { AppHeaderUser } from "@/components/layout/AppHeaderUser";

import { useAuthStore } from "@/store/useAuthStore";
import { CreateEmpresaDTO, empresaToForm, useCreateEmpresa, useEmpresaById, useUpdateEmpresa } from "@/services";

import { formatCnpj, isValidCnpj } from "@/lib/cnpj";

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
      <label className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        {...props}
        required={required}
        aria-label={label}
        className="h-9 rounded-lg border border-border/30 bg-background/50 px-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
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
      <label className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <select
        {...props}
        required={required}
        aria-label={label}
        className="h-9 rounded-lg border border-border/30 bg-background/50 px-3 text-[13px] text-foreground outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
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
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const [form, setForm] = useState<CreateEmpresaDTO>(emptyForm);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState("");
  const navigate = useNavigate();
  const { id: empresaIdParam } = useParams();
  const empresaId = Number(empresaIdParam);
  const isEditing = Boolean(empresaIdParam) && Number.isInteger(empresaId) && empresaId > 0;
  const hydratedEmpresaId = useRef<number | null>(null);

  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);
  const userName =
    basicUserData?.nomeCompleto ||
    userData?.nomeCompleto ||
    userData?.pessoa?.nomeCompleto ||
    "Usuario";
  const userPhoto =
    basicUserData?.fotoPerfil ||
    userData?.fotoPerfil ||
    userData?.pessoa?.fotoPerfil ||
    null;

  const { data: empresa, isLoading: isEmpresaLoading, error: empresaError } = useEmpresaById(
    isEditing ? empresaId : 0,
  );
  const { mutate: createEmpresa, isPending: isCreating } = useCreateEmpresa();
  const { mutate: updateEmpresa, isPending: isUpdating } = useUpdateEmpresa();
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!isEditing || !empresa || hydratedEmpresaId.current === empresa.id) {
      return;
    }

    setForm(empresaToForm(empresa));
    hydratedEmpresaId.current = empresa.id;
  }, [empresa, isEditing]);

  function set(field: keyof CreateEmpresaDTO, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMessage("");
    if (field === "cep") {
      setCepMessage("");
    }
  }

  useEffect(() => {
    const cep = form.cep.replace(/\D/g, "");

    if (cep.length !== 8) {
      setCepLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCepLoading(true);
      setCepMessage("");

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Erro ao consultar CEP.");
        }

        const data = (await response.json()) as {
          erro?: boolean;
          logradouro?: string;
          bairro?: string;
          localidade?: string;
          uf?: string;
        };

        if (data.erro) {
          setCepMessage("CEP não encontrado.");
          return;
        }

        setForm((prev) => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          uf: data.uf || prev.uf,
        }));
        setCepMessage("Endereço preenchido pelo CEP.");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setCepMessage("Não foi possível consultar o CEP.");
      } finally {
        setCepLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [form.cep]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!isValidCnpj(form.cnpj)) {
      setErrorMessage("Informe um CNPJ válido.");
      return;
    }

    const mutationOptions = {
      onSuccess: () => setSuccess(true),
      onError: (error: Error) => {
        setErrorMessage(error.message || `Erro ao ${isEditing ? "atualizar" : "cadastrar"} empresa.`);
      },
    };

    if (isEditing) {
      updateEmpresa({ id: empresaId, data: form }, mutationOptions);
      return;
    }

    createEmpresa(form, mutationOptions);
  }

  return (
    <div className="app-layout relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
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
        <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />

        {/* Main */}
        <AppMain collapsed={sidebarCollapsed}>
          <header
            className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b border-border/20 bg-background/80 backdrop-blur-xl"
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

            <AppHeaderUser name={userName} photoUrl={userPhoto} />
          </header>

          <div className="px-6 pt-6 pb-8 max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-[22px] font-bold text-foreground tracking-tight">
                {isEditing ? "Editar Empresa" : "Cadastrar Empresa"}
              </h1>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {isEditing
                  ? "Atualize as informações cadastrais da empresa."
                  : "Preencha os dados para registrar uma nova empresa na plataforma."}
              </p>
            </div>

            <FormValidation as="form" onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12px] text-destructive"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
                {isEditing && empresaError && !errorMessage && (
                  <motion.div
                    className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12px] text-destructive"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Não foi possível carregar os dados da empresa.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dados da empresa */}
              <motion.div
                className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm p-5 space-y-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">Dados da Empresa</p>
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
                <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">Endereço</p>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <InputField
                      label="CEP"
                      required
                      placeholder="00000-000"
                      value={form.cep}
                      onChange={(e) => set("cep", formatCep(e.target.value))}
                    />
                    {(cepLoading || cepMessage) && (
                      <p
                        className={`mt-1 text-[10px] ${
                          cepMessage.includes("preenchido")
                            ? "text-accent"
                            : "text-muted-foreground"
                        }`}
                      >
                        {cepLoading ? "Consultando CEP..." : cepMessage}
                      </p>
                    )}
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
                <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">Contato</p>
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
                <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">Representante Legal</p>
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
                  className="h-9 px-5 rounded-lg border border-border/30 text-[13px] text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isPending || (isEditing && isEmpresaLoading)}
                  className="h-9 px-6 rounded-lg bg-accent text-accent-foreground text-[13px] font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  whileTap={{ scale: 0.97 }}
                >
                  {isPending
                    ? "Salvando..."
                    : isEditing
                      ? "Salvar Alterações"
                      : "Cadastrar Empresa"}
                </motion.button>
              </motion.div>
            </FormValidation>
          </div>
        </AppMain>
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
                  <h2 className="text-[16px] font-semibold text-foreground">
                    {isEditing ? "Empresa atualizada!" : "Empresa cadastrada!"}
                  </h2>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {form.nomeFantasia || form.razaoSocial} foi {isEditing ? "atualizada" : "registrada"} com sucesso.
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isEditing && (
                    <motion.button
                      onClick={() => { setSuccess(false); setForm(emptyForm); }}
                      className="flex-1 h-9 rounded-lg border border-border/30 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                      whileTap={{ scale: 0.97 }}
                    >
                      Cadastrar outra
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => navigate("/empresas")}
                    className="flex-1 h-9 rounded-lg bg-accent text-accent-foreground text-[12px] font-medium hover:bg-accent/90 transition-colors"
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
