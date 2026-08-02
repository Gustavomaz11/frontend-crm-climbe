import { useState, useMemo } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useSidebarState } from "@/hooks/useSidebarState";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, Calendar as CalendarIcon, Shield, Building2, Settings,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Plus, Search,
  Clock, MapPin, X, GripVertical, Video, FileCheck, UserCheck, ScrollText
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import {
  useCreateReuniao,
  useDeleteReuniao,
  useEmpresas,
  useParticipantesReuniao,
  useReunioes,
  useUpdateReuniao,
  useUsuarios,
} from "@/services";
import { useAuthStore } from "@/store/useAuthStore";
import { shouldShowAgendaReuniao } from "./agendaVisibility";

interface AgendaEvent {
  id: string;
  title: string;
  time: string;
  endTime: string;
  diaInteiro?: boolean;
  empresa: string;
  local?: string;
  type: "virtual" | "presencial";
  color: string;
  data?: string;
  hora?: string;
  empresaId?: number;
  pauta?: string;
  presencial: boolean;
  dateKey: string;
  status: string;
}

interface KanbanCard {
  id: string;
  title: string;
  empresa: string;
  date: string;
  type: "virtual" | "presencial";
  priority: "alta" | "media" | "baixa";
  event?: AgendaEvent;
}

const kanbanColumns = [
  { id: "agendado", status: "AGENDADA", title: "Agendado", color: "accent" },
  { id: "confirmado", status: "CONFIRMADA", title: "Confirmado", color: "primary" },
  { id: "realizado", status: "REALIZADA", title: "Realizado", color: "accent" },
  { id: "cancelado", status: "CANCELADA", title: "Cancelado", color: "destructive" },
];

const initialKanbanCards: Record<string, KanbanCard[]> = {
  agendado: [
    { id: "k1", title: "Onboarding Nova Capital", empresa: "Nova Capital", date: "18/03", type: "virtual", priority: "alta" },
    { id: "k2", title: "Due Diligence Apex", empresa: "Apex Ventures", date: "20/03", type: "presencial", priority: "media" },
  ],
  confirmado: [
    { id: "k3", title: "Revisão Contratual Meridian", empresa: "Meridian Partners", date: "17/03", type: "virtual", priority: "alta" },
    { id: "k4", title: "Apresentação Horizon", empresa: "Horizon Group", date: "19/03", type: "presencial", priority: "baixa" },
  ],
  realizado: [
    { id: "k5", title: "Alinhamento Solare", empresa: "Solare Investimentos", date: "14/03", type: "virtual", priority: "media" },
  ],
  cancelado: [
    { id: "k6", title: "Follow-up Vértice", empresa: "Vértice Consultoria", date: "12/03", type: "virtual", priority: "baixa" },
  ],
};

const DOW = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const WEEK_DAYS = ["SEG", "TER", "QUA", "QUI", "SEX"];

const toDateInputValue = () => {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const formatEventTime = (dateString?: string) => {
  if (!dateString) return "--:--";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAgendaTimeRange = (ev: Pick<AgendaEvent, "time" | "endTime" | "diaInteiro">) =>
  ev.diaInteiro ? ev.time : `${ev.time} - ${ev.endTime}`;

const eventDateInput = (date: Date) => {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const formatInputTime = (date: Date) =>
  `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

const addOneHour = (time: string) => {
  const [hours = "0", minutes = "0"] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours) + 1, Number(minutes), 0, 0);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildCalendarGrid = (year: number, month: number) => {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
};

const dateKey = (date: Date) => eventDateInput(date);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWorkWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const isSameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const matchesSearch = (event: AgendaEvent, query: string) => {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return true;

  return [event.title, event.empresa, event.local, event.pauta]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase("pt-BR").includes(normalized));
};

const normalizeKanbanColumnId = (status?: string) => {
  const normalized = (status || "AGENDADA").trim().toUpperCase();
  if (["CONFIRMADO", "CONFIRMADA"].includes(normalized)) return "confirmado";
  if (["REALIZADO", "REALIZADA"].includes(normalized)) return "realizado";
  if (["CANCELADO", "CANCELADA"].includes(normalized)) return "cancelado";
  return "agendado";
};

const getKanbanPriority = (event: AgendaEvent): KanbanCard["priority"] => {
  if (normalizeKanbanColumnId(event.status) === "cancelado") return "baixa";

  const eventDate = new Date(`${event.dateKey}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / 86400000);
  if (diffDays <= 0) return "alta";
  if (diffDays <= 3) return "media";
  return "baixa";
};

const formatKanbanDate = (event: AgendaEvent) => {
  const date = new Date(`${event.dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return event.data ?? "--/--";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const isPersistedAgendaEvent = (event: AgendaEvent) => {
  const id = Number(event.id);
  return Number.isFinite(id) && id > 0;
};

const isGoogleExternalEvent = (event: AgendaEvent) => {
  return event.status === "GOOGLE_CALENDAR" || !isPersistedAgendaEvent(event);
};

const initialEventForm = () => ({
  titulo: "",
  empresaId: "",
  data: toDateInputValue(),
  hora: "",
  local: "",
  pauta: "",
  presencial: true,
  status: "AGENDADA",
  participanteIds: [] as number[],
});

const Agenda = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const [activeView, setActiveView] = useState<"mes" | "semana" | "lista" | "kanban">("mes");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [draggedCard, setDraggedCard] = useState<{ card: KanbanCard; fromCol: string } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [participantSearchQuery, setParticipantSearchQuery] = useState("");
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [eventError, setEventError] = useState("");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { data: reunioes = [] } = useReunioes();
  const { data: empresas = [] } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();
  const { data: participantesReuniao = [] } = useParticipantesReuniao();
  const { mutateAsync: createReuniao, isPending: creatingReuniao } = useCreateReuniao();
  const { mutateAsync: updateReuniao, isPending: updatingReuniao } = useUpdateReuniao();
  const { mutateAsync: deleteReuniao, isPending: deletingReuniao } = useDeleteReuniao();
  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);

  const today = new Date();
  const currentMonth = visibleDate.getMonth();
  const currentYear = visibleDate.getFullYear();
  const currentMonthLabel = visibleDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
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
  const visibleMonthShortLabel = visibleDate.toLocaleDateString("pt-BR", {
    month: "short",
  });

  const weekDays = useMemo(() => {
    const start = startOfWorkWeek(visibleDate);
    return Array.from({ length: 5 }, (_, index) => addDays(start, index));
  }, [visibleDate]);

  const weekLabel = useMemo(() => {
    const [start] = weekDays;
    const end = weekDays[weekDays.length - 1];
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

    if (sameMonth) {
      return `Semana de ${start.getDate()} a ${end.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`;
    }

    return `Semana de ${start.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })} a ${end.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }, [weekDays]);

  const calendarGrid = useMemo(() => buildCalendarGrid(currentYear, currentMonth), [currentMonth, currentYear]);
  const agendaEvents = useMemo<AgendaEvent[]>(() => {
    return reunioes
      .filter(shouldShowAgendaReuniao)
      .map((reuniao) => {
        const date = new Date(reuniao.dataHora);
        if (Number.isNaN(date.getTime())) return null;

        const empresa =
          reuniao.empresa?.nome ||
          reuniao.empresa?.nomeFantasia ||
          reuniao.empresa?.razaoSocial ||
          empresas.find((item) => item.id === reuniao.empresaId)?.nome ||
          `Empresa #${reuniao.empresaId}`;

        const diaInteiro = Boolean(reuniao.diaInteiro);
        const timeLabel = diaInteiro ? "Dia inteiro" : formatEventTime(reuniao.dataHora);

        return {
          id: String(reuniao.id),
          title: reuniao.titulo,
          time: timeLabel,
          endTime: diaInteiro ? "--" : addOneHour(formatEventTime(reuniao.dataHora)),
          diaInteiro,
          empresa,
          local: reuniao.local,
          type: reuniao.presencial ? "presencial" : "virtual",
          color: reuniao.googleEventId ? "accent" : "primary",
          data: reuniao.data ?? eventDateInput(date),
          hora: reuniao.hora ?? formatInputTime(date),
          empresaId: reuniao.empresaId,
          pauta: reuniao.pauta ?? reuniao.descricao,
          presencial: Boolean(reuniao.presencial),
          dateKey: dateKey(date),
          status: reuniao.status ?? "AGENDADA",
        };
      })
      .filter((event): event is AgendaEvent => event !== null)
      .sort((a, b) => `${a.dateKey} ${a.hora ?? a.time}`.localeCompare(`${b.dateKey} ${b.hora ?? b.time}`));
  }, [reunioes, empresas]);

  const filteredAgendaEvents = useMemo(
    () => agendaEvents.filter((event) => matchesSearch(event, searchQuery)),
    [agendaEvents, searchQuery],
  );

  const filteredUsuarios = useMemo(() => {
    const normalize = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const query = normalize(participantSearchQuery.trim());
    if (!query) return usuarios;

    return usuarios.filter((usuario) =>
      normalize(`${usuario.nomeCompleto ?? ""} ${usuario.email ?? ""}`).includes(query),
    );
  }, [participantSearchQuery, usuarios]);

  const dynamicMonthEvents = useMemo<Record<number, AgendaEvent[]>>(() => {
    const grouped: Record<number, AgendaEvent[]> = {};

    filteredAgendaEvents.forEach((event) => {
      const date = new Date(`${event.dateKey}T00:00:00`);
      if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) return;

      const day = date.getDate();
      grouped[day] = [...(grouped[day] ?? []), event];
    });

    return grouped;
  }, [filteredAgendaEvents, currentMonth, currentYear]);
  const eventDays = useMemo(() => new Set(Object.keys(dynamicMonthEvents).map(Number)), [dynamicMonthEvents]);
  const eventsByDate = useMemo(() => {
    return filteredAgendaEvents.reduce<Record<string, AgendaEvent[]>>((acc, event) => {
      acc[event.dateKey] = [...(acc[event.dateKey] ?? []), event];
      return acc;
    }, {});
  }, [filteredAgendaEvents]);
  const kanbanEvents = useMemo<Record<string, KanbanCard[]>>(() => {
    const grouped = kanbanColumns.reduce<Record<string, KanbanCard[]>>((acc, column) => {
      acc[column.id] = [];
      return acc;
    }, {});

    agendaEvents.forEach((event) => {
      if (isGoogleExternalEvent(event)) return;

      const columnId = normalizeKanbanColumnId(event.status);
      grouped[columnId] = [
        ...(grouped[columnId] ?? []),
        {
          id: event.id,
          title: event.title,
          empresa: event.empresa,
          date: formatKanbanDate(event),
          type: event.type,
          priority: getKanbanPriority(event),
          event,
        },
      ];
    });

    return grouped;
  }, [agendaEvents]);

  const goToPreviousMonth = () => {
    setVisibleDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setVisibleDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const goToPreviousWeek = () => setVisibleDate((date) => addDays(date, -7));
  const goToNextWeek = () => setVisibleDate((date) => addDays(date, 7));
  const goToToday = () => {
    const now = new Date();
    setVisibleDate(now);
    setSelectedDay(now.getDate());
  };

  const openCreateEventModal = () => {
    setEditingEventId(null);
    setEventError("");
    setParticipantSearchQuery("");
    setEventForm(initialEventForm());
    setShowAddEvent(true);
  };

  const closeEventModal = () => {
    setEditingEventId(null);
    setEventError("");
    setParticipantSearchQuery("");
    setShowAddEvent(false);
  };

  const updateEventStatus = async (event: AgendaEvent, status: string) => {
    if (!isPersistedAgendaEvent(event) || !event.empresaId || !event.data || !event.hora) {
      setEventError("Não foi possível atualizar o status da reunião.");
      return;
    }

    await updateReuniao({
      id: Number(event.id),
      data: {
        titulo: event.title,
        empresaId: event.empresaId,
        data: event.data,
        hora: event.hora,
        local: event.local ?? "",
        pauta: event.pauta ?? "",
        presencial: event.presencial,
        status,
      },
    });
  };

  const handleDragStart = (card: KanbanCard, fromCol: string) => setDraggedCard({ card, fromCol });
  const handleDragOver = (e: React.DragEvent, colId: string) => { e.preventDefault(); setDragOverCol(colId); };
  const handleDrop = async (colId: string) => {
    if (!draggedCard || draggedCard.fromCol === colId) {
      setDraggedCard(null);
      setDragOverCol(null);
      return;
    }

    const targetColumn = kanbanColumns.find((column) => column.id === colId);
    const event = draggedCard.card.event;
    if (!targetColumn || !event || !isPersistedAgendaEvent(event) || !event.empresaId || !event.data || !event.hora) {
      setDraggedCard(null);
      setDragOverCol(null);
      return;
    }

    try {
      await updateEventStatus(event, targetColumn.status);
    } catch {
      setEventError("Não foi possível atualizar o status da reunião.");
    } finally {
      setDraggedCard(null);
      setDragOverCol(null);
    }
  };

  const handleCreateEvent = async () => {
    setEventError("");

    if (!eventForm.titulo.trim() || !eventForm.empresaId || !eventForm.data || !eventForm.hora) {
      setEventError("Preencha pauta, empresa, data e horário.");
      return;
    }

    try {
      const payload = {
        titulo: eventForm.titulo.trim(),
        empresaId: Number(eventForm.empresaId),
        data: eventForm.data,
        hora: eventForm.hora,
        local: eventForm.local.trim(),
        pauta: eventForm.pauta.trim(),
        presencial: eventForm.presencial,
        status: eventForm.status,
        participanteIds: eventForm.participanteIds,
      };

      if (editingEventId) {
        await updateReuniao({ id: editingEventId, data: payload });
      } else {
        await createReuniao(payload);
      }

      setEventForm(initialEventForm());
      setEditingEventId(null);
      setShowAddEvent(false);
    } catch {
      setEventError("Não foi possível confirmar o agendamento.");
    }
  };

  const handleEditEvent = (event: AgendaEvent) => {
    if (isGoogleExternalEvent(event)) {
      setEventError("Eventos externos do Google Calendar não podem ser editados pela agenda local.");
      return;
    }

    const reuniaoId = Number(event.id);
    const participanteIds = participantesReuniao
      .filter((participante) => {
        const participanteReuniaoId = participante.reuniao?.idReuniao ?? participante.reuniao?.id;
        return Number(participanteReuniaoId) === reuniaoId;
      })
      .map((participante) => participante.usuario?.id)
      .filter((id): id is number => typeof id === "number");

    setEditingEventId(Number(event.id));
    setEventForm({
      titulo: event.title,
      empresaId: event.empresaId ? String(event.empresaId) : "",
      data: event.data ?? toDateInputValue(),
      hora: event.hora ?? "",
      local: event.presencial ? event.local ?? "" : "",
      pauta: event.pauta ?? "",
      presencial: event.presencial,
      status: event.status,
      participanteIds,
    });
    setEventError("");
    setParticipantSearchQuery("");
    setShowAddEvent(true);
  };

  const handleDeleteEvent = async (event: AgendaEvent) => {
    setEventError("");

    if (isGoogleExternalEvent(event)) {
      setEventError("Eventos externos do Google Calendar não podem ser excluídos pela agenda local.");
      return;
    }

    try {
      await deleteReuniao(Number(event.id));
    } catch {
      setEventError("Não foi possível excluir o agendamento.");
    }
  };

  const priorityColors: Record<string, string> = {
    alta: "bg-destructive/10 text-destructive border-destructive/20",
    media: "bg-primary/10 text-primary border-primary/20",
    baixa: "bg-muted/30 text-muted-foreground border-border/20",
  };

  const isSavingEvent = creatingReuniao || updatingReuniao;
  const isDeletingEvent = deletingReuniao;
  const todayDay = today.getDate();
  const isViewingCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();


  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)` }} />
        <motion.div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.03) 0%, transparent 60%)", filter: "blur(80px)" }} animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <motion.aside className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}`} initial={false} animate={{ x: 0, opacity: 1 }}>
          <div className={`flex items-center h-16 border-b border-border/20 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
            {sidebarCollapsed ? <motion.div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center" whileHover={{ scale: 1.05 }}><span className="text-accent font-bold text-xs">C</span></motion.div> : <ClimbLogo className="h-[16px] text-foreground" />}
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto py-4 px-2">
            <AppSidebarNav collapsed={sidebarCollapsed} />
          </nav>
          <div className="border-t border-border/20 py-3 px-2 space-y-1">
            <motion.button onClick={() => setIsDark(!isDark)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}>
              <AnimatePresence mode="wait"><motion.div key={isDark ? "s" : "m"} initial={{ opacity: 0, rotate: -30 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 30 }} transition={{ duration: 0.2 }}>{isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}</motion.div></AnimatePresence>
              {!sidebarCollapsed && <span className="text-[13px] font-medium">{isDark ? "Modo claro" : "Modo escuro"}</span>}
            </motion.button>
            <Link to="/"><motion.button className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-all ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}><LogOut className="w-[18px] h-[18px]" />{!sidebarCollapsed && <span className="text-[13px] font-medium">Sair</span>}</motion.button></Link>
          </div>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all shadow-sm">
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </motion.aside>

        {/* Main */}
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"}`}>
          <motion.header className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b border-border/20 bg-background/80 backdrop-blur-xl" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border/25 bg-card/30 backdrop-blur-sm text-muted-foreground/50 w-[240px]">
                <Search className="w-3.5 h-3.5" />
                <input type="text" placeholder="Buscar evento..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/30 text-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center h-9 rounded-lg border border-border/25 bg-card/30 backdrop-blur-sm overflow-hidden">
                {(["mes", "semana", "lista", "kanban"] as const).map(v => (
                  <motion.button key={v} onClick={() => setActiveView(v)} className={`h-full px-4 text-[12px] font-medium transition-all ${activeView === v ? "bg-accent/15 text-accent" : "text-muted-foreground/50 hover:text-foreground"}`} whileTap={{ scale: 0.97 }}>
                    {v === "mes" ? "Mês" : v === "semana" ? "Semana" : v === "lista" ? "Lista" : "Kanban"}
                  </motion.button>
                ))}
              </div>
              <motion.button onClick={openCreateEventModal} className="h-9 px-4 rounded-lg bg-accent text-accent-foreground text-[12px] font-semibold flex items-center gap-2 shadow-[0_2px_10px_-2px_hsl(var(--accent)/0.3)]" whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Plus className="w-3.5 h-3.5" /> Agendar
              </motion.button>
              <UserAvatar name={userName} photoUrl={userPhoto} />
            </div>
          </motion.header>

          <div className="px-6 pt-6 pb-2">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">Agenda de Eventos</h1>
            <p className="text-[12px] text-muted-foreground/50 mt-0.5">Visualize os próximos eventos de forma interativa com a agenda.</p>
          </div>

          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {/* MES */}
              {activeView === "mes" && (
                <motion.div key="mes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex gap-6">
                  <div className="flex-1 rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/15">
                      <div className="flex items-center gap-3">
                        <motion.button onClick={goToPreviousMonth} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20" whileTap={{ scale: 0.9 }}><ChevronLeft className="w-4 h-4" /></motion.button>
                        <h3 className="text-[15px] font-semibold text-foreground capitalize">{currentMonthLabel}</h3>
                        <motion.button onClick={goToNextMonth} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20" whileTap={{ scale: 0.9 }}><ChevronRight className="w-4 h-4" /></motion.button>
                      </div>
                      <button onClick={goToToday} className="h-7 px-3 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-border/25 transition-all">Hoje</button>
                    </div>
                    <div className="grid grid-cols-7 border-b border-border/10">
                      {DOW.map(d => <div key={d} className="text-center py-2.5 text-[10px] font-medium text-muted-foreground/40 tracking-wider uppercase">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7">
                      {calendarGrid.map((day, i) => {
                        const events = day ? dynamicMonthEvents[day] || [] : [];
                        const isToday = isViewingCurrentMonth && day === todayDay;
                        const isSelected = day === selectedDay;
                        return (
                          <motion.div key={i} className={`min-h-[100px] border-b border-r border-border/10 p-1.5 cursor-pointer transition-all duration-200 ${day === null ? "bg-muted/5" : isSelected ? "bg-accent/5 ring-1 ring-inset ring-accent/20" : isToday ? "bg-accent/[0.03]" : "hover:bg-muted/10"}`} onClick={() => day && setSelectedDay(day === selectedDay ? null : day)} whileTap={day ? { scale: 0.98 } : undefined}>
                            {day && (
                              <>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] mb-1 ${isToday ? "bg-accent text-accent-foreground font-bold" : "text-foreground/50 font-medium"}`}>{day}</div>
                                {events.map(ev => (
                                  <motion.div
                                    key={ev.id}
                                    className={`rounded px-1.5 py-0.5 mb-0.5 text-[9px] font-medium truncate cursor-pointer ${ev.type === "virtual" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}
                                    whileHover={{ scale: 1.02 }}
                                    title={ev.diaInteiro ? `Dia inteiro - ${ev.title}` : `${ev.time} - ${ev.title}`}
                                  >
                                    {ev.diaInteiro ? ev.title : `${ev.time} ${ev.title}`}
                                  </motion.div>
                                ))}
                              </>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right sidebar */}
                  <div className="w-[280px] space-y-4 shrink-0">
                    <div className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[13px] font-semibold text-foreground capitalize">{currentMonthLabel}</h4>
                        <div className="flex gap-1">
                          <button onClick={goToPreviousMonth} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground"><ChevronLeft className="w-3 h-3" /></button>
                          <button onClick={goToNextMonth} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground"><ChevronRight className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {["D","S","T","Q","Q","S","S"].map((d, i) => <div key={i} className="text-center text-[8px] font-medium text-muted-foreground/30 py-0.5">{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5">
                        {calendarGrid.map((day, i) => {
                          const has = day ? eventDays.has(day) : false;
                          const isT = isViewingCurrentMonth && day === todayDay;
                          const isS = day === selectedDay;
                          return <div key={i} onClick={() => day && setSelectedDay(day === selectedDay ? null : day)} className={`aspect-square flex items-center justify-center text-[9px] rounded cursor-pointer transition-all ${day === null ? "" : isS ? "bg-accent text-accent-foreground font-bold" : isT ? "bg-accent text-accent-foreground font-bold" : has ? "bg-accent/15 text-accent font-semibold" : "text-foreground/50 hover:bg-muted/20"}`}>{day}</div>;
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm p-4">
                      <h4 className="text-[12px] font-semibold text-foreground mb-3">Eventos do dia</h4>
                      {selectedDay && dynamicMonthEvents[selectedDay] ? (
                        <div className="space-y-2">
                          {dynamicMonthEvents[selectedDay].map(ev => (
                            <motion.div key={ev.id} className="rounded-lg border border-border/20 bg-background/50 p-3" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                              <p className="text-[12px] font-medium text-foreground/80 mb-1">{ev.title}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 mb-1"><Clock className="w-3 h-3" /><span>{formatAgendaTimeRange(ev)}</span></div>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 mb-1"><Building2 className="w-3 h-3" /><span>{ev.empresa}</span></div>
                              {ev.local && <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50"><MapPin className="w-3 h-3" /><span>{ev.local}</span></div>}
                              <div className={`inline-flex items-center gap-1 text-[8px] font-medium px-1.5 py-0.5 rounded-full mt-2 ${ev.type === "virtual" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                                {ev.type === "virtual" ? <Video className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                                {ev.type === "virtual" ? "Virtual" : "Presencial"}
                              </div>
                              {!isGoogleExternalEvent(ev) && (
                                <div className="mt-3 flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditEvent(ev)}
                                    className="h-7 rounded-md border border-border/25 px-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isDeletingEvent}
                                    onClick={() => handleDeleteEvent(ev)}
                                    className="h-7 rounded-md border border-destructive/20 px-2.5 text-[10px] font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      ) : <p className="text-[11px] text-muted-foreground/30 text-center py-4">{selectedDay ? "Sem eventos neste dia" : "Clique em um dia"}</p>}
                    </div>

                    <div className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm p-4">
                      <h4 className="text-[12px] font-semibold text-foreground mb-3">Agendar Reunião</h4>
                      <div className="space-y-2.5">
                        <div><label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Pauta *</label><input type="text" placeholder="Pauta da reunião..." className="w-full h-8 px-2.5 rounded-lg border border-border/25 bg-background/50 text-[11px] outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground/30" /></div>
                        <div><label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Empresa</label><input type="text" placeholder="Nome..." className="w-full h-8 px-2.5 rounded-lg border border-border/25 bg-background/50 text-[11px] outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground/30" /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Data</label><input type="date" className="w-full h-8 px-2 rounded-lg border border-border/25 bg-background/50 text-[11px] outline-none focus:border-accent/40" /></div>
                          <div><label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Hora</label><input type="time" className="w-full h-8 px-2 rounded-lg border border-border/25 bg-background/50 text-[11px] outline-none focus:border-accent/40" /></div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded border-border/30 accent-[hsl(var(--accent))]" /><span className="text-[11px] text-foreground/70">Presencial</span></label>
                        <motion.button className="w-full h-8 rounded-lg bg-accent text-accent-foreground text-[11px] font-semibold shadow-[0_2px_8px_-2px_hsl(var(--accent)/0.3)]" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>Confirmar</motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SEMANA */}
              {activeView === "semana" && (
                <motion.div key="semana" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.button onClick={goToPreviousWeek} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-border/20" whileTap={{ scale: 0.9 }}><ChevronLeft className="w-4 h-4" /></motion.button>
                      <button onClick={goToToday} className="h-7 px-3 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-border/25 transition-all">Hoje</button>
                      <motion.button onClick={goToNextWeek} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-border/20" whileTap={{ scale: 0.9 }}><ChevronRight className="w-4 h-4" /></motion.button>
                    </div>
                    <p className="text-[12px] text-muted-foreground/50 capitalize">{weekLabel}</p>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    {weekDays.map((dayDate, i) => {
                      const d = WEEK_DAYS[i];
                      const dayNum = dayDate.getDate();
                      const isToday = isSameDate(dayDate, today);
                      const dayEvents = eventsByDate[dateKey(dayDate)] || [];
                      return (
                        <motion.div
                          key={dayDate.toISOString()}
                          className={`rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden min-h-[400px] flex flex-col ${isToday ? "border-accent/30 bg-accent/[0.03]" : "border-border/25"}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          {/* Day header */}
                          <div className={`px-4 py-3 border-b text-center ${isToday ? "border-accent/20 bg-accent/5" : "border-border/15"}`}>
                            <p className="text-[10px] font-medium text-muted-foreground/50 tracking-wider uppercase">{d}</p>
                            <p className={`text-[22px] font-bold mt-0.5 ${isToday ? "text-accent" : "text-foreground/70"}`}>{dayNum}</p><p className="text-[9px] text-muted-foreground/35 capitalize">{dayDate.toLocaleDateString("pt-BR", { month: "short" })}</p>
                          </div>
                          {/* Events */}
                          <div className="p-3 space-y-2 flex-1">
                            {dayEvents.map((ev, ei) => (
                              <motion.div
                                key={ev.id}
                                className={`rounded-lg p-3 cursor-pointer transition-all ${ev.type === "virtual" ? "bg-accent/8 border border-accent/15 hover:bg-accent/15" : "bg-primary/8 border border-primary/15 hover:bg-primary/15"}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.06 + ei * 0.05 }}
                                whileHover={{ y: -2, boxShadow: "0 4px 12px -4px hsl(var(--accent) / 0.15)" }}
                              >
                                <p className="text-[12px] font-semibold text-foreground/80 mb-1.5">{ev.title}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 mb-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatAgendaTimeRange(ev)}</span>
                                </div>
                                <div className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${ev.type === "virtual" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"}`}>
                                  {ev.type === "virtual" ? <Video className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                                  {ev.type === "virtual" ? "Virtual" : "Presencial"}
                                </div>
                              </motion.div>
                            ))}
                            {dayEvents.length === 0 && (
                              <div className="flex items-center justify-center h-20 text-[10px] text-muted-foreground/20">Sem eventos</div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* LISTA */}
              {activeView === "lista" && (
                <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/15">
                    <h3 className="text-[14px] font-semibold text-foreground capitalize">Todos os Eventos - {currentMonthLabel}</h3>
                  </div>
                  <div className="divide-y divide-border/10 max-h-[calc(100vh-240px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {Object.entries(dynamicMonthEvents).sort(([a], [b]) => Number(a) - Number(b)).map(([day, events]) =>
                      events.map(ev => (
                        <motion.div key={ev.id} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/10 transition-colors cursor-pointer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ x: 2 }}>
                          <div className="w-10 text-center">
                            <p className="text-[16px] font-bold text-foreground">{day}</p>
                            <p className="text-[9px] text-muted-foreground/40 capitalize">{visibleMonthShortLabel}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] font-medium text-foreground">{ev.title}</p>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 mt-0.5">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatAgendaTimeRange(ev)}</span>
                              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{ev.empresa}</span>
                              {ev.local && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.local}</span>}
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full ${ev.type === "virtual" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                            {ev.type === "virtual" ? <Video className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                            {ev.type === "virtual" ? "Virtual" : "Presencial"}
                          </span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* KANBAN */}
              {activeView === "kanban" && (
                <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-4 gap-4">
                  {kanbanColumns.map((col, colIndex) => (
                    <motion.div key={col.id} className={`rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden flex flex-col transition-all duration-300 ${dragOverCol === col.id ? "border-accent/40 bg-accent/[0.03] scale-[1.01]" : "border-border/25"}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: colIndex * 0.08 }} onDragOver={e => handleDragOver(e, col.id)} onDragLeave={() => setDragOverCol(null)} onDrop={() => handleDrop(col.id)}>
                      <div className="px-4 py-3 border-b border-border/15 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <motion.div className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(var(--${col.color}))` }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: colIndex * 0.5 }} />
                          <span className="text-[12px] font-semibold text-foreground">{col.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground/40 bg-muted/20 px-1.5 py-0.5 rounded">{kanbanEvents[col.id]?.length || 0}</span>
                      </div>
                      <div className="p-3 space-y-2 flex-1 min-h-[400px]">
                        <AnimatePresence>
                          {(kanbanEvents[col.id] || []).map((card, ci) => (
                            <motion.div
                              key={card.id}
                              draggable={!updatingReuniao}
                              onDragStart={() => handleDragStart(card, col.id)}
                              className="rounded-lg border border-border/20 bg-background/60 p-3 cursor-grab active:cursor-grabbing hover:border-accent/20 transition-all group"
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              transition={{ type: "spring", stiffness: 300, damping: 25, delay: ci * 0.05 }}
                              whileHover={{ y: -3, boxShadow: "0 8px 20px -8px hsl(var(--accent) / 0.15)" }}
                              whileDrag={{ scale: 1.05, rotate: 2, boxShadow: "0 12px 30px -8px hsl(var(--accent) / 0.25)", zIndex: 50 }}
                              layout
                            >
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-[12px] font-medium text-foreground leading-snug pr-2">{card.title}</p>
                                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/40 shrink-0 mt-0.5 transition-colors" />
                              </div>
                              <p className="text-[10px] text-muted-foreground/50 mb-2">{card.empresa}</p>
                              {card.event?.local && <p className="text-[9px] text-muted-foreground/40 mb-2 truncate">{card.event.local}</p>}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/40"><CalendarIcon className="w-3 h-3" /><span>{card.date}</span></div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full border ${priorityColors[card.priority]}`}>{card.priority}</span>
                                  <span className={`inline-flex items-center gap-0.5 text-[8px] font-medium px-1.5 py-0.5 rounded-full ${card.type === "virtual" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                                    {card.type === "virtual" ? <Video className="w-2 h-2" /> : <MapPin className="w-2 h-2" />}
                                    {card.type === "virtual" ? "Virtual" : "Presencial"}
                                  </span>
                                </div>
                              </div>
                              {card.event && !isGoogleExternalEvent(card.event) && (
                                <div className="mt-3 flex flex-wrap justify-end gap-2">
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => handleEditEvent(card.event!)}
                                    className="h-6 rounded-md border border-border/25 px-2 text-[9px] font-medium text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isDeletingEvent}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => handleDeleteEvent(card.event!)}
                                    className="h-6 rounded-md border border-destructive/20 px-2 text-[9px] font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {(kanbanEvents[col.id] || []).length === 0 && (
                          <motion.div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-border/20 text-[10px] text-muted-foreground/20" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>Arraste cards aqui</motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddEvent && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={closeEventModal} />
            <motion.div className="relative z-10 w-full max-w-md max-h-[calc(100vh-48px)] rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden" initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}>
              <div className="flex items-center justify-between p-5 border-b border-border/20">
                <h2 className="text-[16px] font-semibold text-foreground">Agendar Reunião</h2>
                <motion.button onClick={closeEventModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><X className="w-4 h-4" /></motion.button>
              </div>
              <div className="p-5 space-y-4 max-h-[calc(100vh-130px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div>
                  <label className="text-[10px] text-muted-foreground/50 font-medium tracking-wider uppercase mb-1.5 block">Pauta</label>
                  <input type="text" placeholder="Pauta da reunião..." value={eventForm.titulo} onChange={(e) => setEventForm((prev) => ({ ...prev, titulo: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[13px] outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground/30" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground/50 font-medium tracking-wider uppercase mb-1.5 block">Empresa</label>
                  <select value={eventForm.empresaId} onChange={(e) => setEventForm((prev) => ({ ...prev, empresaId: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[13px] outline-none focus:border-accent/40 transition-colors">
                    <option value="">Selecione</option>
                    {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground/50 font-medium tracking-wider uppercase mb-1.5 block">Participantes</label>
                  <div className="mb-2 flex h-9 items-center gap-2 rounded-lg border border-border/25 bg-background/50 px-3 text-muted-foreground/45 transition-colors focus-within:border-accent/40">
                    <Search className="h-3.5 w-3.5 shrink-0" />
                    <input
                      type="text"
                      value={participantSearchQuery}
                      onChange={(e) => setParticipantSearchQuery(e.target.value)}
                      placeholder="Filtrar por nome ou e-mail"
                      className="min-w-0 flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground/35"
                    />
                    {participantSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setParticipantSearchQuery("")}
                        className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/45 transition-colors hover:bg-muted/20 hover:text-foreground"
                        aria-label="Limpar filtro de participantes"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-border/25 bg-background/50 p-2 space-y-1.5">
                    {usuarios.length === 0 ? (
                      <p className="px-2 py-2 text-[11px] text-muted-foreground/40">Nenhum usuario cadastrado.</p>
                    ) : filteredUsuarios.length > 0 ? filteredUsuarios.map((usuario) => {
                      const checked = eventForm.participanteIds.includes(usuario.id);
                      return (
                        <label key={usuario.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-foreground/75 transition-colors hover:bg-muted/20">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setEventForm((prev) => ({
                                ...prev,
                                participanteIds: e.target.checked
                                  ? [...prev.participanteIds, usuario.id]
                                  : prev.participanteIds.filter((id) => id !== usuario.id),
                              }));
                            }}
                            className="h-3.5 w-3.5 rounded border-border/40 accent-[hsl(var(--accent))]"
                          />
                          <span className="min-w-0 truncate">{usuario.nomeCompleto || usuario.email}</span>
                        </label>
                      );
                    }) : (
                      <p className="px-2 py-2 text-[11px] text-muted-foreground/40">Nenhum participante encontrado para este filtro.</p>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground/40">
                    {eventForm.participanteIds.length > 0
                      ? `${eventForm.participanteIds.length} participante(s) selecionado(s).`
                      : "Selecione os usuarios que participarao da reuniao."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] text-muted-foreground/50 font-medium tracking-wider uppercase mb-1.5 block">Data</label><input type="date" value={eventForm.data} onChange={(e) => setEventForm((prev) => ({ ...prev, data: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[13px] outline-none focus:border-accent/40 text-foreground" /></div>
                  <div><label className="text-[10px] text-muted-foreground/50 font-medium tracking-wider uppercase mb-1.5 block">Horário</label><input type="time" value={eventForm.hora} onChange={(e) => setEventForm((prev) => ({ ...prev, hora: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[13px] outline-none focus:border-accent/40 text-foreground" /></div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground/50 font-medium tracking-wider uppercase mb-1.5 block">Local</label>
                  <input type="text" placeholder="Sala, endereço ou link" value={eventForm.local} disabled={!eventForm.presencial} onChange={(e) => setEventForm((prev) => ({ ...prev, local: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[13px] outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground/30 disabled:cursor-not-allowed disabled:opacity-45" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="tipo-modal" checked={!eventForm.presencial} onChange={() => setEventForm((prev) => ({ ...prev, presencial: false, local: "" }))} className="accent-[hsl(var(--accent))]" /><span className="text-[12px] text-foreground/70">Virtual</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="tipo-modal" checked={eventForm.presencial} onChange={() => setEventForm((prev) => ({ ...prev, presencial: true }))} className="accent-[hsl(var(--accent))]" /><span className="text-[12px] text-foreground/70">Presencial</span></label>
                </div>
                {eventError && <p className="text-[11px] text-destructive">{eventError}</p>}
                <motion.button onClick={handleCreateEvent} disabled={isSavingEvent} className="w-full h-10 rounded-lg bg-accent text-accent-foreground text-[13px] font-semibold shadow-[0_2px_10px_-2px_hsl(var(--accent)/0.3)]" whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}>{isSavingEvent ? "Salvando..." : "Confirmar Agendamento"}</motion.button>
              </div>
              <div className="hidden">
                <div><label className="text-[10px] text-muted-foreground/50 font-medium tracking-wider uppercase mb-1.5 block">Pauta</label><input type="text" placeholder="Pauta da reunião..." className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[13px] outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground/30" /></div>
                <div><label className="text-[10px] text-muted-foreground/50 font-medium tracking-wider uppercase mb-1.5 block">Empresa</label><input type="text" placeholder="Nome da empresa" className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[13px] outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground/30" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] text-muted-foreground/50 font-medium tracking-wider uppercase mb-1.5 block">Data</label><input type="date" className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[13px] outline-none focus:border-accent/40 text-foreground" /></div>
                  <div><label className="text-[10px] text-muted-foreground/50 font-medium tracking-wider uppercase mb-1.5 block">Horário</label><input type="time" className="w-full h-10 px-3 rounded-lg border border-border/25 bg-background/50 text-[13px] outline-none focus:border-accent/40 text-foreground" /></div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground/50 font-medium tracking-wider uppercase mb-1.5 block">Tipo</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="tipo" defaultChecked className="accent-[hsl(var(--accent))]" /><span className="text-[12px] text-foreground/70">Virtual</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="tipo" className="accent-[hsl(var(--accent))]" /><span className="text-[12px] text-foreground/70">Presencial</span></label>
                  </div>
                </div>
                <motion.button onClick={closeEventModal} className="w-full h-10 rounded-lg bg-accent text-accent-foreground text-[13px] font-semibold shadow-[0_2px_10px_-2px_hsl(var(--accent)/0.3)]" whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}>Confirmar Agendamento</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Agenda;
