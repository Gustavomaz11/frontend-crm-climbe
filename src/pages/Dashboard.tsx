import { useMemo, useContext, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "@/context/provider";
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
  Plus,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  TrendingUp,
  Users,
  Maximize2,
  X,
  Download,
  Briefcase,
  MapPin,
  FileCheck,
  UserCheck,
  ScrollText,
} from "lucide-react";

import ClimbLogo from "@/components/login/ClimbLogo";

// ajuste estes imports se sua pasta estiver diferente
import {
  useContratos,
  useEmpresas,
  useReunioes,
  useDocumentos,
  useUsuarios,
  usePermissoes,
} from "@/services";

import { useAuthStore } from "@/store/useAuthStore";

/* ══════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════ */

interface PipelineRow {
  id: number;
  empresa: string;
  tipo: string;
  responsavel: string;
  status: string;
  badge: "active" | "analysis" | "proposal" | "direct";
  data: string;
  isCliente: boolean;
  ultimoContato?: string;
  contratoInfo?: {
    negociado: string;
    validade: string;
    valor: string;
    ultimoContato: string;
  };
  documentos?: {
    name: string;
    status: "validated" | "processing" | "pending";
  }[];
  fluxo?: {
    name: string;
    done: boolean;
  }[];
}

interface Meeting {
  title: string;
  time: string;
  empresa: string;
  local?: string;
}

interface NotificationItem {
  text: string;
  time: string;
  icon: typeof Clock;
  type: "warning" | "alert" | "success" | "info";
}

interface StageItem {
  label: string;
  count: number;
  docs: string[];
}

/* ══════════════════════════════════════════════════
   CONSTS
   ══════════════════════════════════════════════════ */

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

const badgeStyles: Record<PipelineRow["badge"], string> = {
  active: "bg-accent/15 text-accent border-accent/20",
  analysis: "bg-primary/15 text-primary border-primary/20",
  proposal: "bg-destructive/15 text-destructive border-destructive/20",
  direct: "bg-muted text-muted-foreground border-border/30",
};

/* ══════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════ */

function formatDate(dateString?: string) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR");
}

function formatDateShort(dateString?: string) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatDateTime(dateString?: string) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(dateString?: string) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "R$ 0,00";

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getContractBadge(status: string): PipelineRow["badge"] {
  const normalized = status.toLowerCase();

  if (normalized.includes("ativo")) return "active";
  if (normalized.includes("análise") || normalized.includes("analise"))
    return "analysis";
  if (normalized.includes("proposta") || normalized.includes("pendente"))
    return "proposal";

  return "direct";
}

function getRelativeLabel(dateString?: string) {
  if (!dateString) return "Sem data";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Sem data";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "agora mesmo";
  if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;

  return formatDate(dateString);
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(day);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

/* ══════════════════════════════════════════════════
   MAXIMIZE MODAL WRAPPER
   ══════════════════════════════════════════════════ */

const MaximizeModal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          className="relative z-10 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/30 bg-card/95 shadow-2xl backdrop-blur-xl"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between border-b border-border/20 p-5">
            <h2 className="text-[16px] font-semibold text-foreground">
              {title}
            </h2>

            <motion.button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const SectionHeader = ({
  title,
  subtitle,
  onMaximize,
  isMaximized,
  extra,
}: {
  title: string;
  subtitle?: string;
  onMaximize: () => void;
  isMaximized?: boolean;
  extra?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between border-b border-border/15 p-5 pb-4">
    <div>
      <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-0.5 text-[11px] text-muted-foreground/40">
          {subtitle}
        </p>
      )}
    </div>

    <div className="flex items-center gap-2">
      {extra}

      {!isMaximized && (
        <motion.button
          onClick={onMaximize}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 transition-all hover:bg-muted/20 hover:text-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Maximizar"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </motion.button>
      )}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════ */

const Dashboard = () => {
  const { isDark, setIsDark } = useTheme();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState(0);

  const [maxPipeline, setMaxPipeline] = useState(false);
  const [maxNotifications, setMaxNotifications] = useState(false);
  const [maxEmpresas, setMaxEmpresas] = useState(false);
  const [maxCalendar, setMaxCalendar] = useState(false);

  const [pipelineSearch, setPipelineSearch] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState("Todos");
  const [selectedCompany, setSelectedCompany] = useState<PipelineRow | null>(
    null,
  );

  const [empresaSearch, setEmpresaSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [selectedStage, setSelectedStage] = useState<{
    label: string;
    docs: string[];
  } | null>(null);

  const {
    data: contratos = [],
    isLoading: loadingContratos,
    isError: errorContratos,
  } = useContratos();

  const {
    data: empresas = [],
    isLoading: loadingEmpresas,
    isError: errorEmpresas,
  } = useEmpresas();

  const {
    data: reunioes = [],
    isLoading: loadingReunioes,
    isError: errorReunioes,
  } = useReunioes();

  const {
    data: documentos = [],
    isLoading: loadingDocumentos,
    isError: errorDocumentos,
  } = useDocumentos();

  const {
    data: usuarios = [],
    isLoading: loadingUsuarios,
    isError: errorUsuarios,
  } = useUsuarios();

  const {
    data: permissoes = [],
    isLoading: loadingPermissoes,
    isError: errorPermissoes,
  } = usePermissoes();

  const isLoading =
    loadingContratos ||
    loadingEmpresas ||
    loadingReunioes ||
    loadingDocumentos ||
    loadingUsuarios ||
    loadingPermissoes;

  const hasError =
    errorContratos ||
    errorEmpresas ||
    errorReunioes ||
    errorDocumentos ||
    errorUsuarios ||
    errorPermissoes;

  const userName =
    basicUserData?.nomeCompleto ||
    userData?.nomeCompleto ||
    userData?.pessoa?.nomeCompleto ||
    "Usuário";

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const contratosAtivos = useMemo(
    () =>
      contratos.filter((contrato) =>
        contrato.status?.toLowerCase().includes("ativo"),
      ).length,
    [contratos],
  );

  const propostasPendentes = useMemo(
    () =>
      contratos.filter((contrato) => {
        const status = contrato.status?.toLowerCase() ?? "";
        return status.includes("proposta") || status.includes("pendente");
      }).length,
    [contratos],
  );

  const documentosPendentes = useMemo(
    () => documentos.filter((documento) => !documento.caminho).length,
    [documentos],
  );

  const stats = useMemo(
    () => [
      {
        label: "Contratos Ativos",
        value: String(contratosAtivos),
        change: `${contratos.length} contratos no total`,
        trend: "up" as const,
        icon: FileText,
        color: "accent",
      },
      {
        label: "Propostas Pendentes",
        value: String(propostasPendentes),
        change: "Aguardando andamento",
        trend: "neutral" as const,
        icon: TrendingUp,
        color: "primary",
      },
      {
        label: "Documentos Pendentes",
        value: String(documentosPendentes),
        change: `${documentos.length} documentos cadastrados`,
        trend: "down" as const,
        icon: AlertCircle,
        color: "destructive",
      },
      {
        label: "Reuniões",
        value: String(reunioes.length),
        change: `${usuarios.length} usuários no sistema`,
        trend: "up" as const,
        icon: Users,
        color: "accent",
      },
    ],
    [
      contratosAtivos,
      contratos.length,
      propostasPendentes,
      documentosPendentes,
      documentos.length,
      reunioes.length,
      usuarios.length,
    ],
  );

  const empresaById = useMemo(() => {
    const map = new Map<number, (typeof empresas)[number]>();

    empresas.forEach((empresa) => {
      map.set(empresa.id, empresa);
    });

    return map;
  }, [empresas]);

  const documentsByEmpresaId = useMemo(() => {
    const map = new Map<number, typeof documentos>();

    documentos.forEach((documento) => {
      const current = map.get(documento.empresaId) ?? [];
      map.set(documento.empresaId, [...current, documento]);
    });

    return map;
  }, [documentos]);

  const pipelineData = useMemo<PipelineRow[]>(() => {
    return contratos.map((contrato) => {
      const empresa = empresaById.get(contrato.empresaId);
      const empresaDocs = documentsByEmpresaId.get(contrato.empresaId) ?? [];
      const isCliente = contrato.status.toLowerCase().includes("ativo");

      const documentosFormatados = empresaDocs.map((doc) => ({
        name: doc.nome,
        status: (doc.caminho ? "validated" : "pending") as
          | "validated"
          | "processing"
          | "pending",
      }));

      const fluxoBase = [
        {
          name: "Empresa cadastrada",
          done: Boolean(empresa),
        },
        {
          name: "Contrato criado",
          done: Boolean(contrato.id),
        },
        {
          name: "Documentação enviada",
          done: empresaDocs.length > 0,
        },
        {
          name: "Validação documental",
          done: empresaDocs.some((doc) => Boolean(doc.caminho)),
        },
        {
          name: "Processo ativo",
          done: isCliente,
        },
      ];

      return {
        id: contrato.id,
        empresa: empresa?.nome ?? `Empresa #${contrato.empresaId}`,
        tipo: "Contrato",
        responsavel: userName,
        status: contrato.status,
        badge: getContractBadge(contrato.status),
        data: formatDateShort(contrato.dataInicio),
        isCliente,
        ultimoContato: formatDate(contrato.dataAtualizacao),
        contratoInfo: {
          negociado: contrato.descricao,
          validade: formatDate(contrato.dataFim),
          valor: formatCurrency(contrato.valor),
          ultimoContato: formatDate(contrato.dataAtualizacao),
        },
        documentos: documentosFormatados,
        fluxo: fluxoBase,
      };
    });
  }, [contratos, documentsByEmpresaId, empresaById, userName]);

  const pendingCompaniesData = useMemo<PipelineRow[]>(() => {
    return pipelineData.filter((row) => !row.isCliente);
  }, [pipelineData]);

  const meetingsData = useMemo<Record<number, Meeting[]>>(() => {
    const grouped: Record<number, Meeting[]> = {};

    reunioes.forEach((reuniao) => {
      const date = new Date(reuniao.dataHora);

      if (
        Number.isNaN(date.getTime()) ||
        date.getMonth() !== currentMonth ||
        date.getFullYear() !== currentYear
      ) {
        return;
      }

      const empresa = empresaById.get(reuniao.empresaId);
      const day = date.getDate();

      if (!grouped[day]) {
        grouped[day] = [];
      }

      grouped[day].push({
        title: reuniao.titulo,
        time: formatTime(reuniao.dataHora),
        empresa: empresa?.nome ?? `Empresa #${reuniao.empresaId}`,
        local: reuniao.local,
      });
    });

    return grouped;
  }, [reunioes, empresaById, currentMonth, currentYear]);

  const highlightedDays = useMemo(
    () => Object.keys(meetingsData).map(Number),
    [meetingsData],
  );

  const nextMeeting = useMemo(() => {
    const todayDate = today.getDate();

    const futureDays = highlightedDays
      .filter((day) => day >= todayDate)
      .sort((a, b) => a - b);

    if (futureDays.length === 0) return null;

    const day = futureDays[0];
    const meeting = meetingsData[day]?.[0];

    if (!meeting) return null;

    return { day, ...meeting };
  }, [highlightedDays, meetingsData, today]);

  const allNotifications = useMemo<NotificationItem[]>(() => {
    const contractNotifications: NotificationItem[] = contratos
      .slice(0, 4)
      .map((contrato) => ({
        text: `Contrato "${contrato.titulo}" está com status ${contrato.status}`,
        time: getRelativeLabel(contrato.dataAtualizacao),
        icon: contrato.status.toLowerCase().includes("ativo")
          ? CheckCircle2
          : AlertCircle,
        type: contrato.status.toLowerCase().includes("ativo")
          ? "success"
          : "warning",
      }));

    const docNotifications: NotificationItem[] = documentos
      .slice(0, 3)
      .map((doc) => ({
        text: `Documento "${doc.nome}" enviado para empresa ${doc.empresaId}`,
        time: getRelativeLabel(doc.dataUpload),
        icon: FileText,
        type: doc.caminho ? "success" : "info",
      }));

    const meetingNotifications: NotificationItem[] = reunioes
      .slice(0, 3)
      .map((reuniao) => ({
        text: `Reunião "${reuniao.titulo}" agendada para ${formatDateTime(
          reuniao.dataHora,
        )}`,
        time: getRelativeLabel(reuniao.dataCriacao),
        icon: CalendarIcon,
        type: "info",
      }));

    return [
      ...contractNotifications,
      ...docNotifications,
      ...meetingNotifications,
    ].slice(0, 10);
  }, [contratos, documentos, reunioes]);

  const stages = useMemo<StageItem[]>(() => {
    const propostaDocs = contratos
      .filter((item) => item.status.toLowerCase().includes("proposta"))
      .map((item) => item.titulo);

    const analiseDocs = contratos
      .filter((item) => {
        const status = item.status.toLowerCase();
        return status.includes("análise") || status.includes("analise");
      })
      .map((item) => item.titulo);

    const contratoDocs = contratos.map((item) => item.titulo);

    const ativoDocs = contratos
      .filter((item) => item.status.toLowerCase().includes("ativo"))
      .map((item) => item.titulo);

    const encerradoDocs = contratos
      .filter((item) => item.status.toLowerCase().includes("encerr"))
      .map((item) => item.titulo);

    return [
      {
        label: "Proposta",
        count: propostaDocs.length,
        docs: propostaDocs,
      },
      {
        label: "Análise",
        count: analiseDocs.length,
        docs: analiseDocs,
      },
      {
        label: "Contrato",
        count: contratoDocs.length,
        docs: contratoDocs,
      },
      {
        label: "Ativo",
        count: ativoDocs.length,
        docs: ativoDocs,
      },
      {
        label: "Encerr.",
        count: encerradoDocs.length,
        docs: encerradoDocs,
      },
    ];
  }, [contratos]);

  const filteredPipeline = useMemo(() => {
    return pipelineData.filter((row) => {
      const matchSearch = row.empresa
        .toLowerCase()
        .includes(pipelineSearch.toLowerCase());

      const matchFilter =
        pipelineFilter === "Todos" ||
        row.status.toLowerCase().includes(pipelineFilter.toLowerCase()) ||
        row.tipo === pipelineFilter;

      return matchSearch && matchFilter;
    });
  }, [pipelineData, pipelineSearch, pipelineFilter]);

  const filteredEmpresas = useMemo(() => {
    return pendingCompaniesData.filter((row) =>
      row.empresa.toLowerCase().includes(empresaSearch.toLowerCase()),
    );
  }, [pendingCompaniesData, empresaSearch]);

  const handleCompanyClick = (row: PipelineRow) => {
    setSelectedCompany(row);
    setMaxEmpresas(true);
  };

  const renderPipelineTable = (data: PipelineRow[], showSearch = false) => (
    <>
      {showSearch && (
        <div className="border-b border-border/10 px-5 py-3">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-border/25 bg-background/50 px-3 text-muted-foreground">
            <Search className="h-3.5 w-3.5 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Buscar empresa..."
              value={pipelineSearch}
              onChange={(e) => setPipelineSearch(e.target.value)}
              className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/30"
            />
          </div>
        </div>
      )}

      <div className="border-b border-border/10 px-5 py-3">
        <div className="flex items-center gap-1">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.label}
              className="group flex-1 cursor-pointer"
              onClick={() => setSelectedStage(stage)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[9px] font-medium text-muted-foreground/40 transition-colors group-hover:text-accent">
                  {stage.label}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground/30 transition-colors group-hover:text-accent">
                  {stage.count}
                </span>
              </div>

              <motion.div
                className="h-1 overflow-hidden rounded-full bg-muted/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <motion.div
                  className="h-full rounded-full bg-accent/40 transition-colors group-hover:bg-accent/60"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      contratos.length > 0
                        ? (stage.count / Math.max(contratos.length, 1)) * 100
                        : 0
                    }%`,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.4 + index * 0.1,
                    ease: "easeOut",
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-border/10">
        <div className="grid grid-cols-[1fr_80px_80px_90px_70px] px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground/35">
          <span>Empresa</span>
          <span>Tipo</span>
          <span>Resp.</span>
          <span>Status</span>
          <span className="text-right">Data</span>
        </div>

        {data.map((row, index) => (
          <motion.div
            key={row.id}
            className="group grid cursor-pointer grid-cols-[1fr_80px_80px_90px_70px] items-center px-5 py-3 transition-colors duration-200 hover:bg-muted/10"
            onClick={() => handleCompanyClick(row)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
          >
            <span className="text-[13px] font-medium text-foreground transition-colors duration-200 group-hover:text-accent">
              {row.empresa}
            </span>
            <span className="text-[12px] text-muted-foreground/50">
              {row.tipo}
            </span>
            <span className="text-[12px] text-muted-foreground/50">
              {row.responsavel}
            </span>
            <span>
              <span
                className={`inline-flex h-6 items-center rounded-md border px-2.5 text-[10px] font-medium ${badgeStyles[row.badge]}`}
              >
                {row.status}
              </span>
            </span>
            <span className="text-right font-mono text-[12px] text-muted-foreground/40">
              {row.data}
            </span>
          </motion.div>
        ))}

        {data.length === 0 && (
          <div className="px-5 py-8 text-center text-[12px] text-muted-foreground/30">
            Nenhuma empresa encontrada
          </div>
        )}
      </div>
    </>
  );

  const renderNotifications = (items: NotificationItem[]) => (
    <div className="divide-y divide-border/10">
      {items.map((notif, index) => (
        <motion.div
          key={`${notif.text}-${index}`}
          className="group flex cursor-pointer gap-3 px-5 py-4 transition-colors duration-200 hover:bg-muted/10"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              notif.type === "success"
                ? "bg-accent/10 text-accent"
                : notif.type === "alert"
                  ? "bg-destructive/10 text-destructive"
                  : notif.type === "warning"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted/30 text-muted-foreground"
            }`}
          >
            <notif.icon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="leading-relaxed text-[12px] text-foreground/80 transition-colors group-hover:text-foreground">
              {notif.text}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/30">
              {notif.time}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderEmpresaDetail = (company: PipelineRow) => {
    if (company.isCliente && company.contratoInfo) {
      return (
        <div className="space-y-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Building2 className="h-5 w-5 text-accent" />
            </div>

            <div>
              <h4 className="text-[15px] font-semibold text-foreground">
                {company.empresa}
              </h4>
              <p className="text-[11px] font-medium text-accent">
                Cliente ativo · {company.tipo}
              </p>
            </div>

            <span
              className={`ml-auto inline-flex h-6 items-center rounded-md border px-2.5 text-[10px] font-medium ${badgeStyles[company.badge]}`}
            >
              {company.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3 rounded-xl border border-border/20 bg-background/50 p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/40">
                Detalhes do contrato
              </p>

              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-muted-foreground/40">
                    Negociado
                  </p>
                  <p className="text-[12px] text-foreground/80">
                    {company.contratoInfo.negociado}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground/40">Valor</p>
                  <p className="text-[13px] font-semibold text-accent">
                    {company.contratoInfo.valor}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground/40">
                    Validade
                  </p>
                  <p className="text-[12px] text-foreground/80">
                    {company.contratoInfo.validade}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground/40">
                    Último contato
                  </p>
                  <p className="text-[12px] text-foreground/80">
                    {company.contratoInfo.ultimoContato}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/20 bg-background/50 p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/40">
                Ações
              </p>

              <div className="space-y-2">
                <motion.button
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border/25 bg-card/40 text-[12px] text-foreground/70 transition-all hover:border-accent/30 hover:text-accent"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="h-3.5 w-3.5" /> Baixar contrato
                </motion.button>

                <motion.button
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border/25 bg-card/40 text-[12px] text-foreground/70 transition-all hover:border-accent/30 hover:text-accent"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Eye className="h-3.5 w-3.5" /> Ver histórico
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const docs = company.documentos ?? [];
    const fluxo = company.fluxo ?? [];
    const validatedCount = docs.filter(
      (doc) => doc.status === "validated",
    ).length;
    const compliance =
      docs.length > 0 ? Math.round((validatedCount / docs.length) * 100) : 0;

    return (
      <div className="space-y-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h4 className="text-[15px] font-semibold text-foreground">
              {company.empresa}
            </h4>
            <p className="text-[11px] font-medium text-primary">
              Pendente · {company.tipo}
            </p>
          </div>

          <span
            className={`ml-auto inline-flex h-6 items-center rounded-md border px-2.5 text-[10px] font-medium ${badgeStyles[company.badge]}`}
          >
            {company.status}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground/40">
          Último contato: {company.ultimoContato || "—"}
        </p>

        <div className="grid grid-cols-2 gap-x-8">
          <div>
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/35">
              Documentos
            </p>

            {docs.map((doc, index) => (
              <div
                key={`${doc.name}-${index}`}
                className="flex items-center justify-between py-2"
              >
                <span className="text-[12px] text-foreground/70">
                  {doc.name}
                </span>

                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                    doc.status === "validated"
                      ? "bg-accent/10 text-accent"
                      : doc.status === "processing"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/30 text-muted-foreground/40"
                  }`}
                >
                  {doc.status === "validated"
                    ? "Validado"
                    : doc.status === "processing"
                      ? "Em análise"
                      : "Pendente"}
                </span>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/35">
              Fluxo
            </p>

            {fluxo.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="flex items-center gap-2.5 py-2"
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    item.done
                      ? "border-accent bg-accent/10"
                      : "border-border/30"
                  }`}
                >
                  {item.done && (
                    <CheckCircle2 className="h-3 w-3 text-accent" />
                  )}
                </div>

                <span
                  className={`text-[12px] ${
                    item.done
                      ? "text-foreground/70"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/35">
              Conformidade documental
            </span>
            <span className="text-[12px] font-semibold text-accent">
              {compliance}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-muted/20">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${compliance}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderCalendar = (expanded = false) => (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[12px] font-semibold text-foreground">
          {today.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}
        </h4>

        <div className="flex items-center gap-0.5">
          <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground">
            <ChevronLeft className="h-3 w-3" />
          </button>

          <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mb-0.5 grid grid-cols-7 gap-0.5">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="py-0.5 text-center text-[8px] font-medium text-muted-foreground/30"
          >
            {day}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${expanded ? "gap-1.5" : "gap-0.5"}`}>
        {getCalendarDays(currentYear, currentMonth).map((day, index) => {
          const hasMeeting = day !== null && highlightedDays.includes(day);
          const isToday = day === today.getDate();
          const isSelected = day === selectedDay;

          return (
            <motion.div
              key={`${day}-${index}`}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded text-[10px] transition-all ${
                expanded ? "aspect-square min-h-[40px]" : "aspect-square"
              } ${
                day === null
                  ? ""
                  : isSelected
                    ? "bg-accent text-accent-foreground ring-1 ring-accent/30"
                    : isToday
                      ? "bg-accent text-accent-foreground font-semibold"
                      : hasMeeting
                        ? "bg-accent/15 font-semibold text-accent hover:bg-accent/25"
                        : "text-foreground/50 hover:bg-muted/20"
              }`}
              whileHover={day ? { scale: expanded ? 1.05 : 1.08 } : undefined}
              whileTap={day ? { scale: 0.95 } : undefined}
              onClick={() => {
                if (day && hasMeeting) {
                  setSelectedDay(day === selectedDay ? null : day);
                }
              }}
            >
              {day}

              {hasMeeting && !isToday && !isSelected && (
                <div className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent" />
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedDay && meetingsData[selectedDay] && (
          <motion.div
            className="mt-4 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/40">
              Reuniões em {selectedDay.toString().padStart(2, "0")}/
              {(currentMonth + 1).toString().padStart(2, "0")}
            </p>

            {meetingsData[selectedDay].map((meeting, index) => (
              <motion.div
                key={`${meeting.title}-${index}`}
                className="space-y-1 rounded-lg border border-border/20 bg-background/50 p-3"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-foreground">
                    {meeting.title}
                  </p>
                  <span className="font-mono text-[10px] text-accent">
                    {meeting.time}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {meeting.empresa}
                  </span>

                  {meeting.local && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {meeting.local}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {expanded && (
        <div className="mt-5 border-t border-border/15 pt-4">
          {!showAddMeeting ? (
            <motion.button
              onClick={() => setShowAddMeeting(true)}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-accent/30 text-[12px] font-medium text-accent transition-all hover:bg-accent/5"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar reunião
            </motion.button>
          ) : (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-[11px] font-medium text-foreground">
                Nova reunião
              </p>

              <input
                type="text"
                placeholder="Título"
                className="h-9 w-full rounded-lg border border-border/25 bg-background/50 px-3 text-[12px] outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-accent/40"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Empresa"
                  className="h-9 rounded-lg border border-border/25 bg-background/50 px-3 text-[12px] outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-accent/40"
                />
                <input
                  type="text"
                  placeholder="Horário (HH:MM)"
                  className="h-9 rounded-lg border border-border/25 bg-background/50 px-3 text-[12px] outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-accent/40"
                />
              </div>

              <input
                type="text"
                placeholder="Local / Link"
                className="h-9 w-full rounded-lg border border-border/25 bg-background/50 px-3 text-[12px] outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-accent/40"
              />

              <div className="flex items-center justify-end gap-2">
                <motion.button
                  onClick={() => setShowAddMeeting(false)}
                  className="h-8 rounded-md px-3 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  whileTap={{ scale: 0.98 }}
                >
                  Cancelar
                </motion.button>

                <motion.button
                  onClick={() => setShowAddMeeting(false)}
                  className="h-8 rounded-md bg-accent px-4 text-[11px] font-medium text-accent-foreground"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Confirmar
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Carregando dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="max-w-md rounded-xl border border-destructive/20 bg-card p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            Erro ao carregar dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Não foi possível buscar os dados da API. Verifique a autenticação, o
            token e a URL da API.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-500">
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)
            `,
          }}
        />

        <motion.div
          className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent) / 0.03) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <motion.aside
          className={`fixed bottom-0 left-0 top-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${
            sidebarCollapsed ? "w-[72px]" : "w-[220px]"
          }`}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className={`flex h-16 items-center border-b border-border/20 ${
              sidebarCollapsed ? "justify-center px-2" : "px-5"
            }`}
          >
            {sidebarCollapsed ? (
              <motion.div
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-xs font-bold text-accent">C</span>
              </motion.div>
            ) : (
              <ClimbLogo className="h-[16px] text-foreground" />
            )}
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item, index) => (
              <motion.button
                key={item.label}
                onClick={() => {
                  setActiveNav(index);
                  navigate(item.path);
                }}
                className={`group relative flex w-full items-center gap-3 rounded-lg transition-all duration-200 ${
                  sidebarCollapsed
                    ? "justify-center px-2 py-2.5"
                    : "px-3 py-2.5"
                } ${
                  activeNav === index
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                }`}
                whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeNav === index && (
                  <motion.div
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent"
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-[13px] font-medium">{item.label}</span>
                )}
              </motion.button>
            ))}
          </nav>

          <div className="space-y-1 border-t border-border/20 px-2 py-3">
            <motion.button
              onClick={() => setIsDark(!isDark)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all duration-200 hover:bg-muted/30 hover:text-foreground ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              whileTap={{ scale: 0.98 }}
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
                    <Sun className="h-[18px] w-[18px]" />
                  ) : (
                    <Moon className="h-[18px] w-[18px]" />
                  )}
                </motion.div>
              </AnimatePresence>

              {!sidebarCollapsed && (
                <span className="text-[13px] font-medium">
                  {isDark ? "Modo claro" : "Modo escuro"}
                </span>
              )}
            </motion.button>

            <motion.button
              onClick={() => authContext?.signOut()}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground/50 transition-all duration-200 hover:bg-destructive/5 hover:text-destructive ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="h-[18px] w-[18px]" />
              {!sidebarCollapsed && (
                <span className="text-[13px] font-medium">Sair</span>
              )}
            </motion.button>
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border/40 bg-card text-muted-foreground shadow-sm transition-all duration-200 hover:border-accent/40 hover:text-foreground"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        </motion.aside>

        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"
          }`}
        >
          <motion.header
            className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/20 bg-background/80 px-6 backdrop-blur-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40">
                bem-vindo de volta
              </p>
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                {userName}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                className="flex h-9 items-center gap-2 rounded-lg border border-border/25 bg-card/30 px-3 text-muted-foreground/40 backdrop-blur-sm"
                whileHover={{ borderColor: "hsl(var(--accent) / 0.3)" }}
              >
                <Search className="h-3.5 w-3.5" />
                <span className="text-[12px]">Buscar...</span>
                <kbd className="ml-4 rounded border border-border/30 px-1.5 py-0.5 text-[9px] text-muted-foreground/25">
                  ⌘K
                </kbd>
              </motion.div>

              <motion.button
                onClick={() => setMaxNotifications(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/25 bg-card/20 text-muted-foreground transition-all duration-200 hover:border-accent/30 hover:text-foreground"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-accent-foreground">
                  {allNotifications.length > 9 ? "9+" : allNotifications.length}
                </span>
              </motion.button>

              <motion.div
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/20 bg-accent/15"
                whileHover={{ scale: 1.03 }}
              >
                <span className="text-[11px] font-semibold text-accent">
                  {userName
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
              </motion.div>
            </div>
          </motion.header>

          <motion.div
            className="space-y-6 p-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="flex items-center justify-between"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <motion.button
                  className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[12px] font-semibold text-accent-foreground shadow-[0_2px_10px_-2px_hsl(var(--accent)/0.3)]"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="h-3.5 w-3.5" /> Novo Contrato
                </motion.button>

                <div className="flex h-9 items-center gap-2 rounded-lg border border-border/25 bg-card/20 px-3 text-[12px] text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {today.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
              variants={itemVariants}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-xl border border-border/25 bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-accent/20 hover:bg-card/60"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 0%, hsl(var(--accent) / 0.04), transparent 70%)",
                    }}
                  />

                  <div className="relative z-10">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground/60">
                        {stat.label}
                      </span>

                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          stat.color === "accent"
                            ? "bg-accent/10 text-accent"
                            : stat.color === "primary"
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        <stat.icon className="h-4 w-4" />
                      </div>
                    </div>

                    <motion.p
                      className="mb-1.5 text-[28px] font-bold leading-none tracking-tight text-foreground"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.3 + index * 0.1,
                      }}
                    >
                      {stat.value}
                    </motion.p>

                    <p className="flex items-center gap-1 text-[13px] text-muted-foreground/50">
                      {stat.trend === "up" && (
                        <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
                      )}
                      {stat.trend === "down" && (
                        <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                      )}
                      {stat.change}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <motion.div
                className="overflow-hidden rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm xl:col-span-3"
                variants={itemVariants}
              >
                <SectionHeader
                  title="Pipeline dos Contratos"
                  subtitle="Dados em tempo real"
                  onMaximize={() => setMaxPipeline(true)}
                  extra={
                    <div className="flex items-center gap-2">
                      {["Todos", "Ativo", "Proposta", "Análise"].map(
                        (filter) => (
                          <button
                            key={filter}
                            onClick={() => setPipelineFilter(filter)}
                            className={`h-7 rounded-md px-2.5 text-[10px] font-medium transition-all duration-200 ${
                              filter === pipelineFilter
                                ? "border border-accent/20 bg-accent/10 text-accent"
                                : "text-muted-foreground/50 hover:bg-muted/20 hover:text-foreground"
                            }`}
                          >
                            {filter}
                          </button>
                        ),
                      )}
                    </div>
                  }
                />

                <div className="border-b border-border/10 px-5 py-3">
                  <div className="flex h-8 items-center gap-2 rounded-lg border border-border/20 bg-background/40 px-3 text-muted-foreground">
                    <Search className="h-3.5 w-3.5 text-muted-foreground/30" />
                    <input
                      type="text"
                      placeholder="Buscar empresa..."
                      value={pipelineSearch}
                      onChange={(e) => setPipelineSearch(e.target.value)}
                      className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/25"
                    />
                  </div>
                </div>

                {renderPipelineTable(filteredPipeline)}
              </motion.div>

              <motion.div
                className="overflow-hidden rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm xl:col-span-2"
                variants={itemVariants}
              >
                <SectionHeader
                  title="Notificações Recentes"
                  onMaximize={() => setMaxNotifications(true)}
                  extra={
                    <button
                      onClick={() => setMaxNotifications(true)}
                      className="flex items-center gap-1 text-[11px] text-accent transition-colors hover:text-accent/80"
                    >
                      Ver Todas <ArrowUpRight className="h-3 w-3" />
                    </button>
                  }
                />

                {renderNotifications(allNotifications.slice(0, 4))}
              </motion.div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <motion.div
                className="overflow-hidden rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm xl:col-span-3"
                variants={itemVariants}
              >
                <SectionHeader
                  title="Empresas"
                  subtitle="Pendentes — documentação em análise"
                  onMaximize={() => {
                    setSelectedCompany(null);
                    setMaxEmpresas(true);
                  }}
                />

                <div className="border-b border-border/10 px-5 py-3">
                  <div className="flex h-8 items-center gap-2 rounded-lg border border-border/20 bg-background/40 px-3 text-muted-foreground">
                    <Search className="h-3.5 w-3.5 text-muted-foreground/30" />
                    <input
                      type="text"
                      placeholder="Buscar empresa..."
                      value={empresaSearch}
                      onChange={(e) => setEmpresaSearch(e.target.value)}
                      className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/25"
                    />
                  </div>
                </div>

                <div className="max-h-[320px] divide-y divide-border/10 overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                  {filteredEmpresas.map((row, index) => (
                    <motion.div
                      key={row.id}
                      className="group flex cursor-pointer items-center justify-between px-5 py-3 transition-colors duration-200 hover:bg-muted/10"
                      onClick={() => handleCompanyClick(row)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Briefcase className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-[13px] font-medium text-foreground transition-colors group-hover:text-accent">
                            {row.empresa}
                          </p>
                          <p className="text-[10px] text-muted-foreground/40">
                            {row.tipo} · {row.responsavel} · Contato:{" "}
                            {row.ultimoContato || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-6 items-center rounded-md border px-2.5 text-[10px] font-medium ${badgeStyles[row.badge]}`}
                        >
                          {row.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {filteredEmpresas.length === 0 && (
                    <div className="px-5 py-8 text-center text-[12px] text-muted-foreground/30">
                      Nenhuma empresa encontrada
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="overflow-hidden rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm xl:col-span-2"
                variants={itemVariants}
              >
                <SectionHeader
                  title="Calendário"
                  onMaximize={() => setMaxCalendar(true)}
                  extra={
                    <motion.button
                      onClick={() => {
                        setMaxCalendar(true);
                        setShowAddMeeting(true);
                      }}
                      className="h-7 rounded-md border border-accent/20 bg-accent/10 px-3 text-[10px] font-medium text-accent"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      + Agendar
                    </motion.button>
                  }
                />

                <div className="p-5">
                  {nextMeeting && (
                    <motion.div
                      className="mb-4 flex items-center gap-3 rounded-lg border border-accent/15 bg-accent/5 p-3"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                        <CalendarIcon className="h-4 w-4 text-accent" />
                      </div>

                      <div className="flex-1">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/40">
                          Próxima reunião
                        </p>
                        <p className="text-[12px] font-medium text-foreground">
                          {nextMeeting.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50">
                          {nextMeeting.day}/
                          {(currentMonth + 1).toString().padStart(2, "0")} às{" "}
                          {nextMeeting.time} · {nextMeeting.empresa}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {renderCalendar()}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>

      <MaximizeModal
        isOpen={maxPipeline}
        onClose={() => setMaxPipeline(false)}
        title="Pipeline dos Contratos"
      >
        <div className="mb-4 flex items-center gap-2">
          {["Todos", "Ativo", "Proposta", "Análise"].map((filter) => (
            <button
              key={filter}
              onClick={() => setPipelineFilter(filter)}
              className={`h-7 rounded-md px-2.5 text-[10px] font-medium transition-all ${
                filter === pipelineFilter
                  ? "border border-accent/20 bg-accent/10 text-accent"
                  : "text-muted-foreground/50 hover:bg-muted/20 hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {renderPipelineTable(filteredPipeline, true)}
      </MaximizeModal>

      <MaximizeModal
        isOpen={maxNotifications}
        onClose={() => setMaxNotifications(false)}
        title="Todas as Notificações"
      >
        {renderNotifications(allNotifications)}
      </MaximizeModal>

      <MaximizeModal
        isOpen={maxEmpresas}
        onClose={() => {
          setMaxEmpresas(false);
          setSelectedCompany(null);
        }}
        title={selectedCompany ? selectedCompany.empresa : "Empresas"}
      >
        {selectedCompany ? (
          <div>
            <motion.button
              onClick={() => setSelectedCompany(null)}
              className="mb-4 flex items-center gap-1 text-[11px] text-accent hover:underline"
              whileTap={{ scale: 0.98 }}
            >
              <ChevronLeft className="h-3 w-3" /> Voltar à lista
            </motion.button>

            {renderEmpresaDetail(selectedCompany)}
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex h-8 items-center gap-2 rounded-lg border border-border/20 bg-background/40 px-3">
                  <Search className="h-3.5 w-3.5 text-muted-foreground/30" />
                  <input
                    type="text"
                    placeholder="Buscar empresa pendente..."
                    value={empresaSearch}
                    onChange={(e) => setEmpresaSearch(e.target.value)}
                    className="flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground/25"
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/10">
              {filteredEmpresas.map((row, index) => (
                <motion.div
                  key={row.id}
                  className="-mx-3 group flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 transition-colors duration-200 hover:bg-muted/10"
                  onClick={() => setSelectedCompany(row)}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Briefcase className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[13px] font-medium text-foreground transition-colors group-hover:text-accent">
                        {row.empresa}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40">
                        {row.tipo} · {row.responsavel} · Contato:{" "}
                        {row.ultimoContato || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
                      Pendente
                    </span>

                    <span
                      className={`inline-flex h-6 items-center rounded-md border px-2.5 text-[10px] font-medium ${badgeStyles[row.badge]}`}
                    >
                      {row.status}
                    </span>
                  </div>
                </motion.div>
              ))}

              {filteredEmpresas.length === 0 && (
                <div className="py-8 text-center text-[12px] text-muted-foreground/30">
                  Nenhuma empresa encontrada
                </div>
              )}
            </div>
          </div>
        )}
      </MaximizeModal>

      <MaximizeModal
        isOpen={maxCalendar}
        onClose={() => {
          setMaxCalendar(false);
          setShowAddMeeting(false);
        }}
        title={`Calendário — ${today.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })}`}
      >
        {renderCalendar(true)}
      </MaximizeModal>

      <AnimatePresence>
        {selectedStage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setSelectedStage(null)}
            />

            <motion.div
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border/30 bg-card/95 shadow-2xl backdrop-blur-xl"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
            >
              <div className="flex items-center justify-between border-b border-border/20 p-5">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">
                    {selectedStage.label}
                  </h2>
                  <p className="text-[11px] text-muted-foreground/40">
                    {selectedStage.docs.length} documentos
                  </p>
                </div>

                <motion.button
                  onClick={() => setSelectedStage(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              <div className="max-h-[400px] space-y-1.5 overflow-y-auto p-5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                {selectedStage.docs.map((doc, index) => (
                  <motion.div
                    key={`${doc}-${index}`}
                    className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border/15 bg-background/50 px-4 py-3 transition-colors hover:border-accent/20"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-accent" />
                    <span className="flex-1 text-[12px] text-foreground/70 transition-colors group-hover:text-foreground">
                      {doc}
                    </span>
                    <Download className="h-3.5 w-3.5 text-muted-foreground/20 transition-colors group-hover:text-accent" />
                  </motion.div>
                ))}

                {selectedStage.docs.length === 0 && (
                  <div className="py-6 text-center text-[12px] text-muted-foreground/30">
                    Nenhum documento nesta etapa
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
