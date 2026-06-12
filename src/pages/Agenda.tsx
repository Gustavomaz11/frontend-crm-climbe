import { useState, useMemo } from "react";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, Calendar as CalendarIcon, Shield, Building2, Settings,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Plus, Search,
  Clock, MapPin, X, GripVertical, Video, FileCheck, UserCheck, ScrollText
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { useCreateReuniao, useDeleteReuniao, useEmpresas, useReunioes, useUpdateReuniao } from "@/services";

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
}

interface KanbanCard {
  id: string;
  title: string;
  empresa: string;
  date: string;
  type: "virtual" | "presencial";
  priority: "alta" | "media" | "baixa";
}

const monthEvents: Record<number, AgendaEvent[]> = {
  2: [{ id: "m1", title: "Kickoff Projeto", time: "09:00", endTime: "10:00", empresa: "Nova Capital", local: "Google Meet", type: "virtual", color: "accent" }],
  5: [{ id: "m2", title: "Treinamento Interno", time: "14:00", endTime: "16:00", empresa: "Climb Interno", local: "Auditório", type: "presencial", color: "primary" }],
  6: [{ id: "m3", title: "Alinhamento Semanal", time: "10:00", endTime: "10:30", empresa: "Apex Ventures", local: "Zoom", type: "virtual", color: "accent" }],
  9: [{ id: "m4", title: "Apresentação de Resultados", time: "16:00", endTime: "17:00", empresa: "Horizon Group", local: "Sala 2", type: "presencial", color: "primary" }],
  10: [{ id: "m5", title: "Revisão de Contrato", time: "10:30", endTime: "11:30", empresa: "Meridian Partners", local: "Sala 1", type: "presencial", color: "primary" }],
  11: [{ id: "m11b", title: "Sync Operacional", time: "09:30", endTime: "10:00", empresa: "Nova Capital", local: "Google Meet", type: "virtual", color: "accent" }],
  12: [{ id: "m11c", title: "Workshop Financeiro", time: "14:00", endTime: "16:00", empresa: "Solare Investimentos", local: "Auditório", type: "presencial", color: "primary" }],
  13: [{ id: "m6", title: "Kickoff Q2", time: "09:00", endTime: "11:00", empresa: "Solare Investimentos", local: "Google Meet", type: "virtual", color: "accent" }],
  16: [{ id: "m7", title: "Encerramento Sprint", time: "15:00", endTime: "15:30", empresa: "Climb Interno", local: "Zoom", type: "virtual", color: "accent" }],
  19: [{ id: "m8", title: "Comitê de Investimentos", time: "14:00", endTime: "16:00", empresa: "Atlas Participações", local: "Auditório", type: "presencial", color: "primary" }],
  21: [{ id: "m9", title: "Relatório Mensal", time: "11:00", endTime: "12:00", empresa: "Nova Capital", local: "Sala 3", type: "presencial", color: "primary" }],
  25: [{ id: "m10", title: "Revisão Trimestral", time: "14:00", endTime: "15:00", empresa: "Vértice Consultoria", local: "Zoom", type: "virtual", color: "accent" }],
  28: [{ id: "m11", title: "Fechamento Mensal", time: "09:00", endTime: "10:30", empresa: "Climb Interno", local: "Auditório", type: "presencial", color: "primary" }],
};

const kanbanColumns = [
  { id: "agendado", title: "Agendado", color: "accent" },
  { id: "confirmado", title: "Confirmado", color: "primary" },
  { id: "realizado", title: "Realizado", color: "accent" },
  { id: "cancelado", title: "Cancelado", color: "destructive" },
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
  ev.diaInteiro ? ev.time : `${ev.time} – ${ev.endTime}`;

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

/* Map week days (Mon-Fri) to March dates for "current week" simulation (March 9-13) */
const weekDayDates = [9, 10, 11, 12, 13];

const Agenda = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<"mes" | "semana" | "lista" | "kanban">("mes");
  const [kanbanCards, setKanbanCards] = useState<Record<string, KanbanCard[]>>({
    agendado: [],
    confirmado: [],
    realizado: [],
    cancelado: [],
  });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [draggedCard, setDraggedCard] = useState<{ card: KanbanCard; fromCol: string } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventForm, setEventForm] = useState({
    titulo: "",
    empresaId: "",
    data: toDateInputValue(),
    hora: "",
    local: "",
    pauta: "",
    presencial: true,
  });
  const [eventError, setEventError] = useState("");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { data: reunioes = [] } = useReunioes();
  const { data: empresas = [] } = useEmpresas();
  const { mutateAsync: createReuniao, isPending: creatingReuniao } = useCreateReuniao();
  const { mutateAsync: updateReuniao, isPending: updatingReuniao } = useUpdateReuniao();
  const { mutateAsync: deleteReuniao, isPending: deletingReuniao } = useDeleteReuniao();

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentMonthLabel = today.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const calendarGrid = useMemo(() => buildCalendarGrid(currentYear, currentMonth), [currentMonth, currentYear]);
  const dynamicMonthEvents = useMemo<Record<number, AgendaEvent[]>>(() => {
    const grouped: Record<number, AgendaEvent[]> = {};

    reunioes.forEach((reuniao) => {
      const date = new Date(reuniao.dataHora);
      if (
        Number.isNaN(date.getTime()) ||
        date.getMonth() !== currentMonth ||
        date.getFullYear() !== currentYear
      ) {
        return;
      }

      const day = date.getDate();
      const empresa =
        reuniao.empresa?.nome ||
        reuniao.empresa?.nomeFantasia ||
        reuniao.empresa?.razaoSocial ||
        empresas.find((item) => item.id === reuniao.empresaId)?.nome ||
        `Empresa #${reuniao.empresaId}`;

      const diaInteiro = Boolean(reuniao.diaInteiro);
      const timeLabel = diaInteiro ? "Dia inteiro" : formatEventTime(reuniao.dataHora);
      grouped[day] = [
        ...(grouped[day] ?? []),
        {
          id: String(reuniao.id),
          title: reuniao.titulo,
          time: timeLabel,
          endTime: diaInteiro ? "—" : addOneHour(formatEventTime(reuniao.dataHora)),
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
        },
      ];
    });

    return grouped;
  }, [reunioes, empresas, currentMonth, currentYear]);
  const eventDays = useMemo(() => new Set(Object.keys(dynamicMonthEvents).map(Number)), [dynamicMonthEvents]);

  const handleDragStart = (card: KanbanCard, fromCol: string) => setDraggedCard({ card, fromCol });
  const handleDragOver = (e: React.DragEvent, colId: string) => { e.preventDefault(); setDragOverCol(colId); };
  const handleDrop = (colId: string) => {
    if (!draggedCard || draggedCard.fromCol === colId) { setDraggedCard(null); setDragOverCol(null); return; }
    setKanbanCards(prev => {
      const n = { ...prev };
      n[draggedCard.fromCol] = prev[draggedCard.fromCol].filter(c => c.id !== draggedCard.card.id);
      n[colId] = [...prev[colId], draggedCard.card];
      return n;
    });
    setDraggedCard(null);
    setDragOverCol(null);
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
      };

      if (editingEventId) {
        await updateReuniao({ id: editingEventId, data: payload });
      } else {
        await createReuniao(payload);
      }

      setEventForm({
        titulo: "",
        empresaId: "",
        data: toDateInputValue(),
        hora: "",
        local: "",
        pauta: "",
        presencial: true,
      });
      setEditingEventId(null);
      setShowAddEvent(false);
    } catch {
      setEventError("Não foi possível confirmar o agendamento.");
    }
  };

  const handleEditEvent = (event: AgendaEvent) => {
    setEditingEventId(Number(event.id));
    setEventForm({
      titulo: event.title,
      empresaId: event.empresaId ? String(event.empresaId) : "",
      data: event.data ?? toDateInputValue(),
      hora: event.hora ?? "",
      local: event.presencial ? event.local ?? "" : "",
      pauta: event.pauta ?? "",
      presencial: event.presencial,
    });
    setEventError("");
    setShowAddEvent(true);
  };

  const handleDeleteEvent = async (event: AgendaEvent) => {
    setEventError("");

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

  const todayDay = today.getDate();


  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)` }} />
        <motion.div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.03) 0%, transparent 60%)", filter: "blur(80px)" }} animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <motion.aside className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className={`flex items-center h-16 border-b border-border/20 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
            {sidebarCollapsed ? <motion.div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center" whileHover={{ scale: 1.05 }}><span className="text-accent font-bold text-xs">C</span></motion.div> : <ClimbLogo className="h-[16px] text-foreground" />}
          </div>
          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map((item) => (
              <motion.button key={item.label} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-3 rounded-lg transition-all duration-200 group relative ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"} ${item.label === "Agenda" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`} whileHover={{ x: sidebarCollapsed ? 0 : 2 }} whileTap={{ scale: 0.98 }}>
                {item.label === "Agenda" && <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" layoutId="activeNav" />}
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!sidebarCollapsed && <span className="text-[13px] font-medium">{item.label}</span>}
              </motion.button>
            ))}
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
              <motion.button onClick={() => setShowAddEvent(true)} className="h-9 px-4 rounded-lg bg-accent text-accent-foreground text-[12px] font-semibold flex items-center gap-2 shadow-[0_2px_10px_-2px_hsl(var(--accent)/0.3)]" whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Plus className="w-3.5 h-3.5" /> Agendar
              </motion.button>
            </div>
          </motion.header>

          <div className="px-6 pt-6 pb-2">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">Agenda de Eventos</h1>
            <p className="text-[12px] text-muted-foreground/50 mt-0.5">Visualize os próximos eventos de forma interativa com a agenda.</p>
          </div>

          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {/* ═══ MÊS ═══ */}
              {activeView === "mes" && (
                <motion.div key="mes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex gap-6">
                  <div className="flex-1 rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/15">
                      <div className="flex items-center gap-3">
                        <motion.button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20" whileTap={{ scale: 0.9 }}><ChevronLeft className="w-4 h-4" /></motion.button>
                        <h3 className="text-[15px] font-semibold text-foreground capitalize">{currentMonthLabel}</h3>
                        <motion.button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20" whileTap={{ scale: 0.9 }}><ChevronRight className="w-4 h-4" /></motion.button>
                      </div>
                      <button className="h-7 px-3 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-border/25 transition-all">Hoje</button>
                    </div>
                    <div className="grid grid-cols-7 border-b border-border/10">
                      {DOW.map(d => <div key={d} className="text-center py-2.5 text-[10px] font-medium text-muted-foreground/40 tracking-wider uppercase">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7">
                      {calendarGrid.map((day, i) => {
                        const events = day ? dynamicMonthEvents[day] || [] : [];
                        const isToday = day === todayDay;
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
                                    title={ev.diaInteiro ? `Dia inteiro · ${ev.title}` : `${ev.time} · ${ev.title}`}
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
                          <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground"><ChevronLeft className="w-3 h-3" /></button>
                          <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground"><ChevronRight className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {["D","S","T","Q","Q","S","S"].map((d, i) => <div key={i} className="text-center text-[8px] font-medium text-muted-foreground/30 py-0.5">{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5">
                        {calendarGrid.map((day, i) => {
                          const has = day ? eventDays.has(day) : false;
                          const isT = day === todayDay;
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
                                  disabled={deletingReuniao}
                                  onClick={() => handleDeleteEvent(ev)}
                                  className="h-7 rounded-md border border-destructive/20 px-2.5 text-[10px] font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
                                >
                                  Excluir
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : <p className="text-[11px] text-muted-foreground/30 text-center py-4">Clique em um dia</p>}
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

              {/* ═══ SEMANA — Card-based day columns ═══ */}
              {activeView === "semana" && (
                <motion.div key="semana" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-border/20" whileTap={{ scale: 0.9 }}><ChevronLeft className="w-4 h-4" /></motion.button>
                      <button className="h-7 px-3 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-border/25 transition-all">Hoje</button>
                      <motion.button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-border/20" whileTap={{ scale: 0.9 }}><ChevronRight className="w-4 h-4" /></motion.button>
                    </div>
                    <p className="text-[12px] text-muted-foreground/50">Semana de 9 a 13 de Março, 2026</p>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    {WEEK_DAYS.map((d, i) => {
                      const dayNum = weekDayDates[i];
                      const isToday = dayNum === todayDay;
                      const dayEvents = dynamicMonthEvents[dayNum] || [];
                      return (
                        <motion.div
                          key={d}
                          className={`rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden min-h-[400px] flex flex-col ${isToday ? "border-accent/30 bg-accent/[0.03]" : "border-border/25"}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          {/* Day header */}
                          <div className={`px-4 py-3 border-b text-center ${isToday ? "border-accent/20 bg-accent/5" : "border-border/15"}`}>
                            <p className="text-[10px] font-medium text-muted-foreground/50 tracking-wider uppercase">{d}</p>
                            <p className={`text-[22px] font-bold mt-0.5 ${isToday ? "text-accent" : "text-foreground/70"}`}>{dayNum}</p>
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

              {/* ═══ LISTA ═══ */}
              {activeView === "lista" && (
                <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/15">
                    <h3 className="text-[14px] font-semibold text-foreground capitalize">Todos os Eventos — {currentMonthLabel}</h3>
                  </div>
                  <div className="divide-y divide-border/10 max-h-[calc(100vh-240px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {Object.entries(dynamicMonthEvents).sort(([a], [b]) => Number(a) - Number(b)).map(([day, events]) =>
                      events.map(ev => (
                        <motion.div key={ev.id} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/10 transition-colors cursor-pointer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ x: 2 }}>
                          <div className="w-10 text-center">
                            <p className="text-[16px] font-bold text-foreground">{day}</p>
                            <p className="text-[9px] text-muted-foreground/40">MAR</p>
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

              {/* ═══ KANBAN ═══ */}
              {activeView === "kanban" && (
                <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-4 gap-4">
                  {kanbanColumns.map((col, colIndex) => (
                    <motion.div key={col.id} className={`rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden flex flex-col transition-all duration-300 ${dragOverCol === col.id ? "border-accent/40 bg-accent/[0.03] scale-[1.01]" : "border-border/25"}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: colIndex * 0.08 }} onDragOver={e => handleDragOver(e, col.id)} onDragLeave={() => setDragOverCol(null)} onDrop={() => handleDrop(col.id)}>
                      <div className="px-4 py-3 border-b border-border/15 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <motion.div className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(var(--${col.color}))` }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: colIndex * 0.5 }} />
                          <span className="text-[12px] font-semibold text-foreground">{col.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground/40 bg-muted/20 px-1.5 py-0.5 rounded">{kanbanCards[col.id]?.length || 0}</span>
                      </div>
                      <div className="p-3 space-y-2 flex-1 min-h-[400px]">
                        <AnimatePresence>
                          {(kanbanCards[col.id] || []).map((card, ci) => (
                            <motion.div
                              key={card.id}
                              draggable
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
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {(kanbanCards[col.id] || []).length === 0 && (
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
            <motion.div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowAddEvent(false)} />
            <motion.div className="relative z-10 w-full max-w-md rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden" initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}>
              <div className="flex items-center justify-between p-5 border-b border-border/20">
                <h2 className="text-[16px] font-semibold text-foreground">Agendar Reunião</h2>
                <motion.button onClick={() => setShowAddEvent(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><X className="w-4 h-4" /></motion.button>
              </div>
              <div className="p-5 space-y-4">
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
                <motion.button onClick={handleCreateEvent} disabled={creatingReuniao} className="w-full h-10 rounded-lg bg-accent text-accent-foreground text-[13px] font-semibold shadow-[0_2px_10px_-2px_hsl(var(--accent)/0.3)]" whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}>{creatingReuniao ? "Salvando..." : "Confirmar Agendamento"}</motion.button>
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
                <motion.button onClick={() => setShowAddEvent(false)} className="w-full h-10 rounded-lg bg-accent text-accent-foreground text-[13px] font-semibold shadow-[0_2px_10px_-2px_hsl(var(--accent)/0.3)]" whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}>Confirmar Agendamento</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Agenda;
