import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  FileText,
  Calendar as CalendarIcon,
  Shield,
  Building2,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  X,
  UserCheck,
  Clock,
  ChevronDown,
  FileCheck,
  User,
  ScrollText,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { Button } from "@/components/ui/button";

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

type Status = "pendente" | "aprovado" | "recusado";

interface SolicitacaoAcesso {
  id: number;
  nome: string;
  email: string;
  empresa: string;
  cargo: string;
  nivelAcesso: string;
  dataSolicitacao: string;
  status: Status;
  avatarFallback: string;
}

const mockSolicitacoes: SolicitacaoAcesso[] = [
  {
    id: 1,
    nome: "Mariana Costa",
    email: "mariana.costa@techcorp.com",
    empresa: "TechCorp Ltda.",
    cargo: "Analista de Dados",
    nivelAcesso: "Colaborador",
    dataSolicitacao: "2026-06-03T09:15:00",
    status: "pendente",
    avatarFallback: "MC",
  },
  {
    id: 2,
    nome: "Rafael Mendes",
    email: "rafael.mendes@inovate.io",
    empresa: "Inovate Solutions",
    cargo: "Gerente de Projetos",
    nivelAcesso: "Gestor",
    dataSolicitacao: "2026-06-03T08:42:00",
    status: "pendente",
    avatarFallback: "RM",
  },
  {
    id: 3,
    nome: "Juliana Alves",
    email: "j.alves@contabilidade.com.br",
    empresa: "Contabilidade Prime",
    cargo: "Contadora",
    nivelAcesso: "Colaborador",
    dataSolicitacao: "2026-06-02T16:30:00",
    status: "aprovado",
    avatarFallback: "JA",
  },
  {
    id: 4,
    nome: "Carlos Pereira",
    email: "carlos.p@startup.xyz",
    empresa: "Startup XYZ",
    cargo: "CTO",
    nivelAcesso: "Administrador",
    dataSolicitacao: "2026-06-02T14:05:00",
    status: "recusado",
    avatarFallback: "CP",
  },
  {
    id: 5,
    nome: "Fernanda Lima",
    email: "fernanda@grupocrescimento.com",
    empresa: "Grupo Crescimento",
    cargo: "Diretora Financeira",
    nivelAcesso: "Gestor",
    dataSolicitacao: "2026-06-02T11:20:00",
    status: "pendente",
    avatarFallback: "FL",
  },
  {
    id: 6,
    nome: "Bruno Souza",
    email: "b.souza@manufatura.ind.br",
    empresa: "Manufatura Indústria",
    cargo: "Supervisor de RH",
    nivelAcesso: "Colaborador",
    dataSolicitacao: "2026-06-01T17:00:00",
    status: "pendente",
    avatarFallback: "BS",
  },
];

const statusConfig: Record<Status, { label: string; className: string }> = {
  pendente: {
    label: "Pendente",
    className:
      "bg-yellow-400/10 text-yellow-500 border border-yellow-400/20",
  },
  aprovado: {
    label: "Aprovado",
    className:
      "bg-emerald-400/10 text-emerald-500 border border-emerald-400/20",
  },
  recusado: {
    label: "Recusado",
    className: "bg-red-400/10 text-red-500 border border-red-400/20",
  },
};

const nivelAcessoColors: Record<string, string> = {
  Colaborador: "bg-blue-400/10 text-blue-400 border border-blue-400/20",
  Gestor: "bg-purple-400/10 text-purple-400 border border-purple-400/20",
  Administrador: "bg-orange-400/10 text-orange-400 border border-orange-400/20",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AprovarAcesso = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "todos">("todos");
  const [solicitacoes, setSolicitacoes] =
    useState<SolicitacaoAcesso[]>(mockSolicitacoes);
  const [confirmando, setConfirmando] = useState<{
    id: number;
    acao: "aprovar" | "recusar";
  } | null>(null);
  const navigate = useNavigate();

  const filtered = solicitacoes.filter((s) => {
    const matchSearch =
      s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.empresa.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "todos" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendentes = solicitacoes.filter((s) => s.status === "pendente").length;
  const aprovados = solicitacoes.filter((s) => s.status === "aprovado").length;
  const recusados = solicitacoes.filter((s) => s.status === "recusado").length;

  function handleAprovar(id: number) {
    setSolicitacoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "aprovado" } : s))
    );
    setConfirmando(null);
  }

  function handleRecusar(id: number) {
    setSolicitacoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "recusado" } : s))
    );
    setConfirmando(null);
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      {/* Ambient background */}
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
          className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${
            sidebarCollapsed ? "w-[72px]" : "w-[220px]"
          }`}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div
            className={`flex items-center h-16 border-b border-border/20 ${
              sidebarCollapsed ? "justify-center px-2" : "px-5"
            }`}
          >
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
                className={`w-full flex items-center gap-3 rounded-lg transition-all group relative ${
                  sidebarCollapsed
                    ? "justify-center px-2 py-2.5"
                    : "px-3 py-2.5"
                } text-muted-foreground hover:text-foreground hover:bg-muted/30`}
                whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-[13px] font-medium">{item.label}</span>
                )}
              </motion.button>
            ))}
          </nav>

          <div className="border-t border-border/20 py-3 px-2 space-y-1">
            <motion.button
              onClick={() => setIsDark(!isDark)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? "s" : "m"}
                  initial={{ opacity: 0, rotate: -30 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 30 }}
                >
                  {isDark ? (
                    <Sun className="w-[18px] h-[18px]" />
                  ) : (
                    <Moon className="w-[18px] h-[18px]" />
                  )}
                </motion.div>
              </AnimatePresence>
              {!sidebarCollapsed && (
                <span className="text-[13px] font-medium">
                  {isDark ? "Modo claro" : "Modo escuro"}
                </span>
              )}
            </motion.button>

            <Link to="/">
              <motion.button
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-all ${
                  sidebarCollapsed ? "justify-center" : ""
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-[18px] h-[18px]" />
                {!sidebarCollapsed && (
                  <span className="text-[13px] font-medium">Sair</span>
                )}
              </motion.button>
            </Link>
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all shadow-sm"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </button>
        </motion.aside>

        {/* Main content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"
          }`}
        >
          {/* Top header */}
          <motion.header
            className="sticky top-0 z-20 h-16 flex items-center justify-end px-6 border-b border-border/20 bg-background/80 backdrop-blur-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >

            <div className="flex items-center gap-2">
              <motion.div
                className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center"
                whileHover={{ scale: 1.03 }}
              >
                <span className="text-accent font-semibold text-[11px]">
                  AD
                </span>
              </motion.div>
              <div className="text-right">
                <p className="text-[12px] font-medium text-foreground">
                  Administrador
                </p>
                <p className="text-[10px] text-muted-foreground/40">
                  admin@climb.com
                </p>
              </div>
            </div>
          </motion.header>

          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-bold text-foreground tracking-tight">
                  Solicitações de Acesso
                </h1>
                <p className="text-[12px] text-muted-foreground/50 mt-0.5">
                  Gerencie as solicitações de acesso à plataforma.
                </p>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="px-6 pb-4 grid grid-cols-3 gap-3">
            {[
              {
                label: "Pendentes",
                value: pendentes,
                icon: Clock,
                color: "text-yellow-500",
                bg: "bg-yellow-400/8",
              },
              {
                label: "Aprovados",
                value: aprovados,
                icon: UserCheck,
                color: "text-emerald-500",
                bg: "bg-emerald-400/8",
              },
              {
                label: "Recusados",
                value: recusados,
                icon: X,
                color: "text-red-500",
                bg: "bg-red-400/8",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm p-4 flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div
                  className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}
                >
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[22px] font-bold text-foreground leading-none">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          

          {/* Filter tabs */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { value: "todos", label: "Todos" },
                  { value: "pendente", label: "Pendentes" },
                  { value: "aprovado", label: "Aprovados" },
                  { value: "recusado", label: "Recusados" },
                ] as { value: Status | "todos"; label: string }[]
              ).map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    filterStatus === f.value
                      ? "bg-accent/15 text-accent border border-accent/25"
                      : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/20 border border-transparent"
                  }`}
                >
                  {f.label}
                </button>
              ))}
               <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border/25 bg-card/30 backdrop-blur-sm text-muted-foreground/50 w-[260px] ml-auto">
                <Search className="w-3.5 h-3.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/30 text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="px-6 pb-6">
            <motion.div
              className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border/15">
                      <th className="text-left px-5 py-3 text-[10px] font-semibold text-muted-foreground/50 tracking-wider uppercase">
                        Usuário
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground/50 tracking-wider uppercase">
                        Empresa / Cargo
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground/50 tracking-wider uppercase">
                        Nível de Acesso
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground/50 tracking-wider uppercase">
                        Data da Solicitação
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground/50 tracking-wider uppercase">
                        Status
                      </th>
                      <th className="text-right px-5 py-3 text-[10px] font-semibold text-muted-foreground/50 tracking-wider uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filtered.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-14 text-[12px] text-muted-foreground/30"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <User className="w-8 h-8 opacity-20" />
                              <span>Nenhuma solicitação encontrada</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((sol, i) => (
                          <motion.tr
                            key={sol.id}
                            className="border-b border-border/8 hover:bg-muted/10 transition-colors"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            {/* Usuário */}
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                                  <span className="text-accent font-semibold text-[10px]">
                                    {sol.avatarFallback}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-[12px] font-medium text-foreground">
                                    {sol.nome}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground/40">
                                    {sol.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Empresa / Cargo */}
                            <td className="px-4 py-3">
                              <p className="text-[12px] text-foreground/80">
                                {sol.empresa}
                              </p>
                              <p className="text-[10px] text-muted-foreground/40">
                                {sol.cargo}
                              </p>
                            </td>

                            {/* Nível de Acesso */}
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                  nivelAcessoColors[sol.nivelAcesso] ??
                                  "bg-muted/20 text-muted-foreground"
                                }`}
                              >
                                {sol.nivelAcesso}
                              </span>
                            </td>

                            {/* Data */}
                            <td className="px-4 py-3">
                              <p className="text-[11px] text-foreground/60">
                                {formatDate(sol.dataSolicitacao)}
                              </p>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                  statusConfig[sol.status].className
                                }`}
                              >
                                {sol.status === "pendente" && (
                                  <Clock className="w-2.5 h-2.5" />
                                )}
                                {sol.status === "aprovado" && (
                                  <Check className="w-2.5 h-2.5" />
                                )}
                                {sol.status === "recusado" && (
                                  <X className="w-2.5 h-2.5" />
                                )}
                                {statusConfig[sol.status].label}
                              </span>
                            </td>

                            {/* Ações */}
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-2">
                                {sol.status === "pendente" ? (
                                  <>
                                    <motion.button
                                      onClick={() =>
                                        setConfirmando({
                                          id: sol.id,
                                          acao: "aprovar",
                                        })
                                      }
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-400/10 text-emerald-500 border border-emerald-400/20 hover:bg-emerald-400/20 transition-all text-[11px] font-medium"
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                    >
                                      <Check className="w-3 h-3" />
                                      Aprovar
                                    </motion.button>
                                    <motion.button
                                      onClick={() =>
                                        setConfirmando({
                                          id: sol.id,
                                          acao: "recusar",
                                        })
                                      }
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-400/10 text-red-500 border border-red-400/20 hover:bg-red-400/20 transition-all text-[11px] font-medium"
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                    >
                                      <X className="w-3 h-3" />
                                      Recusar
                                    </motion.button>
                                  </>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground/30 italic">
                                    Concluído
                                  </span>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmando && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmando(null)}
            />
            <motion.div
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      confirmando.acao === "aprovar"
                        ? "bg-emerald-400/10"
                        : "bg-red-400/10"
                    }`}
                  >
                    {confirmando.acao === "aprovar" ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">
                      {confirmando.acao === "aprovar"
                        ? "Aprovar acesso"
                        : "Recusar acesso"}
                    </h2>
                    <p className="text-[11px] text-muted-foreground/50">
                      {confirmando.acao === "aprovar"
                        ? "O usuário receberá acesso à plataforma."
                        : "A solicitação será negada."}
                    </p>
                  </div>
                </div>

                <p className="text-[12px] text-foreground/70 leading-relaxed">
                  Tem certeza que deseja{" "}
                  <strong>
                    {confirmando.acao === "aprovar" ? "aprovar" : "recusar"}
                  </strong>{" "}
                  a solicitação de{" "}
                  <strong>
                    {solicitacoes.find((s) => s.id === confirmando.id)?.nome}
                  </strong>
                  ? Esta ação poderá ser revertida posteriormente.
                </p>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-[12px]"
                    onClick={() => setConfirmando(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className={`flex-1 text-[12px] ${
                      confirmando.acao === "aprovar"
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                        : "bg-red-500 hover:bg-red-600 text-white border-0"
                    }`}
                    onClick={() =>
                      confirmando.acao === "aprovar"
                        ? handleAprovar(confirmando.id)
                        : handleRecusar(confirmando.id)
                    }
                  >
                    {confirmando.acao === "aprovar" ? "Sim, aprovar" : "Sim, recusar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AprovarAcesso;
