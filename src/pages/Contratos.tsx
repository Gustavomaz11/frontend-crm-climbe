import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useSidebarState } from "@/hooks/useSidebarState";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, Calendar as CalendarIcon, Shield, Building2, Settings,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Search, Plus, FileCheck, X,
  UserCheck, UploadCloud, File as FileIcon, CheckCircle2, ScrollText, AlertCircle,
  Check, XCircle, History,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import { RevisaoDocumentoDialog } from "@/components/revisoes/RevisaoDocumentoDialog";
import {
  getContratoDownloadUrl,
  getContratoHistorico,
  getPropostaFileNameFromUrl,
  getPropostaDownloadUrl,
  useContratos,
  useCreateContratoWithFile,
  useDesvincularPropostaContrato,
  useEmpresas,
  usePropostas,
  useUsuarios,
  getServiceLabel,
  useUpdateContratoResponsaveis,
  useUpdateContratoStatus,
  type Contrato,
  type HistoricoAprovacaoContrato,
} from "@/services";
import { useAuthStore } from "@/store/useAuthStore";

const statusStyles: Record<string, string> = {
  "PENDENTE": "bg-primary/10 text-primary",
  "APROVADO": "bg-accent/10 text-accent",
  "REJEITADO": "bg-destructive/10 text-destructive",
  "ATIVO": "bg-accent/10 text-accent",
  "ANALISE": "bg-primary/10 text-primary",
  "CONCLUIDO": "bg-accent/10 text-accent",
};

type FilterTab = "Todos" | "Pendente" | "Aprovado" | "Rejeitado";
const tabs: FilterTab[] = ["Todos", "Pendente", "Aprovado", "Rejeitado"];

const STATUS_MAP: Record<FilterTab, string | null> = {
  "Todos": null,
  "Pendente": "PENDENTE",
  "Aprovado": "APROVADO",
  "Rejeitado": "REJEITADO",
};

const ACCEPTED = ".pdf,.ppt,.pptx";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const Contratos = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const [activeTab, setActiveTab] = useState<FilterTab>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [reviewContratoId, setReviewContratoId] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modalError, setModalError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyContrato, setHistoryContrato] = useState<Contrato | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoricoAprovacaoContrato[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedEmpresaId, setSelectedEmpresaId] = useState("");
  const [selectedPropostaId, setSelectedPropostaId] = useState("");
  const [selectedResponsavelId, setSelectedResponsavelId] = useState("");
  const [selectedParticipanteIds, setSelectedParticipanteIds] = useState<number[]>([]);
  const [responsaveisEditOpen, setResponsaveisEditOpen] = useState(false);
  const [editResponsavelId, setEditResponsavelId] = useState("");
  const [editParticipanteIds, setEditParticipanteIds] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: contratos = [], isLoading, error } = useContratos();
  const { data: empresas = [] } = useEmpresas();
  const { data: propostas = [] } = usePropostas();
  const { data: usuarios = [] } = useUsuarios();
  const createContratoWithFile = useCreateContratoWithFile();
  const updateContratoStatus = useUpdateContratoStatus();
  const updateContratoResponsaveis = useUpdateContratoResponsaveis();
  const desvincularPropostaContrato = useDesvincularPropostaContrato();

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

  const propostasAprovadasDaEmpresa = useMemo(() => {
    const empresaId = Number(selectedEmpresaId);
    if (!empresaId) return [];
    const propostasVinculadas = new Set(
      contratos
        .map((contrato) => contrato.propostaId)
        .filter((propostaId): propostaId is number => Boolean(propostaId)),
    );
    return propostas.filter(
      (proposta) =>
        proposta.status === "APROVADA" &&
        Number(proposta.empresaId) === empresaId &&
        !propostasVinculadas.has(proposta.idProposta),
    );
  }, [contratos, propostas, selectedEmpresaId]);
  const selectedProposal = useMemo(
    () => propostasAprovadasDaEmpresa.find((item) => String(item.idProposta) === selectedPropostaId),
    [propostasAprovadasDaEmpresa, selectedPropostaId],
  );

  const handleProposalSelection = (value: string) => {
    setSelectedPropostaId(value);
    const proposta = propostasAprovadasDaEmpresa.find((item) => String(item.idProposta) === value);
    if (proposta) {
      const equipeIds = Array.from(new Set([...(proposta.equipeTecnicaIds || []), ...(proposta.equipeComercialIds || [])]));
      setSelectedParticipanteIds(equipeIds);
      if (!selectedResponsavelId && equipeIds.length > 0) setSelectedResponsavelId(String(equipeIds[0]));
    }
    setUploadError("");
  };

  const usuariosAtivos = useMemo(
    () => usuarios.filter((usuario) => !usuario.situacao || usuario.situacao === "ATIVO"),
    [usuarios],
  );

  useEffect(() => {
    if (searchParams.get("novo") !== "1") return;

    setUploadOpen(true);
    setUploadDone(false);
    setUploadError("");

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("novo");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!uploadError && !uploadDone) return;

    const timer = window.setTimeout(() => {
      setUploadError("");
      setUploadDone(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [uploadError, uploadDone]);

  useEffect(() => {
    if (!actionMessage) return;

    const timer = window.setTimeout(() => {
      setActionMessage(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming).filter(
      (f) => !files.some((ex) => ex.name === f.name && ex.size === f.size)
    );
    setFiles((prev) => [...prev, ...next]);
    setUploadDone(false);
    setUploadError("");
  }, [files]);

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  function openContratoModal(contrato: Contrato) {
    setSelectedContrato(contrato);
    setModalError("");
    setResponsaveisEditOpen(false);
    setEditResponsavelId(contrato.responsavelId ? String(contrato.responsavelId) : "");
    setEditParticipanteIds(contrato.participantes.map((participante) => participante.id));
  }

  function handleStartEditResponsaveis(contrato: Contrato) {
    setModalError("");
    setResponsaveisEditOpen(true);
    setEditResponsavelId(contrato.responsavelId ? String(contrato.responsavelId) : "");
    setEditParticipanteIds(contrato.participantes.map((participante) => participante.id));
  }

  async function handleSaveResponsaveis() {
    if (!selectedContrato) return;

    const responsavelId = Number(editResponsavelId);
    if (!editResponsavelId || !Number.isFinite(responsavelId) || responsavelId <= 0) {
      setModalError("Selecione um responsável para o contrato.");
      return;
    }
    if (editParticipanteIds.length === 0) {
      setModalError("Selecione ao menos um ator para o contrato.");
      return;
    }

    try {
      const atualizado = await updateContratoResponsaveis.mutateAsync({
        id: selectedContrato.id,
        responsavelId,
        participanteIds: editParticipanteIds,
      });
      setSelectedContrato(atualizado);
      setResponsaveisEditOpen(false);
      setActionMessage({ type: "success", text: "Responsável e atores atualizados com sucesso." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar responsável e atores.";
      setModalError(message);
    }
  }

  async function handleUpload() {
    const empresaId = Number(selectedEmpresaId);
    const propostaId = selectedPropostaId ? Number(selectedPropostaId) : null;
    const responsavelId = Number(selectedResponsavelId);

    if (!selectedEmpresaId || !Number.isFinite(empresaId) || empresaId <= 0) {
      setUploadError("Selecione uma empresa para o contrato.");
      return;
    }

    if (propostaId && contratos.some((contrato) => contrato.propostaId === propostaId)) {
      setUploadError("Esta proposta já está vinculada a outro contrato.");
      return;
    }

    if (!selectedResponsavelId || !Number.isFinite(responsavelId) || responsavelId <= 0) {
      setUploadError("Selecione um responsável para o contrato.");
      return;
    }

    if (selectedParticipanteIds.length === 0) {
      setUploadError("Selecione ao menos um ator para o contrato.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      for (const file of files) {
        await createContratoWithFile.mutateAsync({
          file,
          empresaId,
          propostaId,
          responsavelId,
          participanteIds: selectedParticipanteIds,
        });
      }
      setUploading(false);
      setUploadDone(true);
      setFiles([]);
      setSelectedEmpresaId("");
      setSelectedPropostaId("");
      setSelectedResponsavelId("");
      setSelectedParticipanteIds([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao enviar contrato.";
      setUploadError(message);
      setUploading(false);
    }
  }

  async function handleOpenContrato(contrato: Contrato) {
    setModalError("");

    try {
      const url = await getContratoDownloadUrl(contrato.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao abrir contrato.";
      setModalError(message);
    }
  }

  async function handleOpenProposta(contrato: Contrato) {
    setModalError("");

    if (!contrato.propostaId) {
      setModalError("Este contrato não possui proposta vinculada.");
      return;
    }

    try {
      const url = await getPropostaDownloadUrl(contrato.propostaId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao abrir proposta vinculada.";
      setModalError(message);
    }
  }

  async function handleUpdateStatus(contrato: Contrato, status: "APROVADO" | "REJEITADO") {
    setActionMessage(null);

    if (contrato.status !== "PENDENTE") {
      setActionMessage({ type: "error", text: "Não é permitido alterar o status de um contrato já aprovado ou rejeitado." });
      return;
    }

    try {
      await updateContratoStatus.mutateAsync({ id: contrato.id, status });
      setActionMessage({ type: "success", text: `Contrato ${status === "APROVADO" ? "aprovado" : "rejeitado"} com sucesso.` });
      if (selectedContrato?.id === contrato.id) {
        setSelectedContrato({ ...selectedContrato, status });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao alterar status do contrato.";
      setActionMessage({ type: "error", text: message });
    }
  }

  async function handleDesvincularProposta(contrato: Contrato) {
    setModalError("");
    setActionMessage(null);

    if (!contrato.propostaId) {
      setModalError("Este contrato não possui proposta vinculada.");
      return;
    }

    try {
      const atualizado = await desvincularPropostaContrato.mutateAsync(contrato.id);
      setSelectedContrato(atualizado);
      setActionMessage({ type: "success", text: "Proposta desvinculada do contrato com sucesso." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao desvincular proposta.";
      setModalError(message);
    }
  }

  async function handleOpenHistory(contrato: Contrato) {
    setHistoryContrato(contrato);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryItems([]);

    try {
      const historico = await getContratoHistorico(contrato.id);
      setHistoryItems(historico);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar histórico.";
      setHistoryError(message);
    } finally {
      setHistoryLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const statusFilter = STATUS_MAP[activeTab];
    return contratos.filter(c => {
      const matchSearch =
        c.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.empresaNome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.descricao?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter ? c.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [searchQuery, contratos, activeTab]);

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)` }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <motion.aside className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}`} initial={false} animate={{ x: 0, opacity: 1 }}>
          <div className={`flex items-center h-16 border-b border-border/20 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
            {sidebarCollapsed ? <motion.div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center"><span className="text-accent font-bold text-xs">C</span></motion.div> : <ClimbLogo className="h-[16px] text-foreground" />}
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto py-4 px-2">
            <AppSidebarNav collapsed={sidebarCollapsed} />
          </nav>
          <div className="border-t border-border/20 py-3 px-2 space-y-1">
            <motion.button onClick={() => setIsDark(!isDark)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}>
              <AnimatePresence mode="wait"><motion.div key={isDark ? "s" : "m"} initial={{ opacity: 0, rotate: -30 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 30 }}>{isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}</motion.div></AnimatePresence>
              {!sidebarCollapsed && <span className="text-[13px] font-medium">{isDark ? "Modo claro" : "Modo escuro"}</span>}
            </motion.button>
            <Link to="/"><motion.button className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-all ${sidebarCollapsed ? "justify-center" : ""}`} whileTap={{ scale: 0.98 }}><LogOut className="w-[18px] h-[18px]" />{!sidebarCollapsed && <span className="text-[13px] font-medium">Sair</span>}</motion.button></Link>
          </div>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all shadow-sm">
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </motion.aside>

        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"}`}>
          <motion.header className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b border-border/20 bg-background/80 backdrop-blur-xl" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border/25 bg-card/30 backdrop-blur-sm text-muted-foreground/50 w-[280px]">
              <Search className="w-3.5 h-3.5" />
              <input type="text" placeholder="Buscar contratos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/30 text-foreground" />
            </div>
            <UserAvatar name={userName} photoUrl={userPhoto} />
          </motion.header>

          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-[22px] font-bold text-foreground tracking-tight">Contratos</h1>
                <p className="text-[12px] text-muted-foreground/50 mt-0.5">{isLoading ? "Carregando..." : `${filtered.length} de ${contratos.length} contratos`}</p>
              </div>
              <motion.button
                onClick={() => { setUploadOpen(!uploadOpen); setUploadDone(false); setUploadError(""); }}
                className="h-9 px-4 rounded-lg bg-accent text-accent-foreground text-[12px] font-semibold flex items-center gap-2 shadow-[0_2px_10px_-2px_hsl(var(--accent)/0.3)]"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-3.5 h-3.5" /> Novo Contrato
              </motion.button>
            </div>

            <AnimatePresence>
              {uploadOpen && (
                <motion.div className="mb-4 rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                  <div className="p-4">
                    <input ref={inputRef} type="file" multiple accept={ACCEPTED} className="hidden" onChange={(e) => addFiles(e.target.files)} />
                    <AnimatePresence>
                      {(uploadError || uploadDone) && (
                        <motion.div
                          className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] ${uploadError ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-accent/20 bg-accent/5 text-accent"}`}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                        >
                          {uploadError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                          <span>{uploadError || "Contrato enviado com sucesso!"}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <motion.div
                      onClick={() => inputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      animate={dragOver ? { scale: 1.01 } : { scale: 1 }}
                      className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-7 cursor-pointer transition-colors select-none ${dragOver ? "border-accent/60 bg-accent/5" : "border-border/30 hover:border-accent/40 hover:bg-muted/10"}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dragOver ? "bg-accent/15" : "bg-muted/20"}`}>
                        <UploadCloud className={`w-5 h-5 transition-colors ${dragOver ? "text-accent" : "text-muted-foreground/50"}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] font-medium text-foreground/80">{dragOver ? "Solte os arquivos aqui" : "Clique para selecionar ou arraste o arquivo"}</p>
                        <p className="text-[11px] text-muted-foreground/40 mt-0.5">PDF, PPT ou PPTX · o cliente receberá por e-mail</p>
                      </div>
                    </motion.div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Empresa</label>
                        <select
                          value={selectedEmpresaId}
                          onChange={(e) => { setSelectedEmpresaId(e.target.value); setSelectedPropostaId(""); setUploadError(""); }}
                          className="w-full h-9 px-2.5 rounded-lg border border-border/25 bg-background/50 text-[12px] outline-none focus:border-accent/40 transition-colors text-foreground"
                        >
                          <option value="">Selecione a empresa</option>
                          {empresas.filter((empresa) => Number(empresa.id) > 0).map((empresa) => (
                            <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Proposta aprovada</label>
                        <select
                          value={selectedPropostaId}
                          onChange={(e) => handleProposalSelection(e.target.value)}
                          disabled={!selectedEmpresaId}
                          className="w-full h-9 px-2.5 rounded-lg border border-border/25 bg-background/50 text-[12px] outline-none focus:border-accent/40 transition-colors text-foreground disabled:opacity-45 disabled:cursor-not-allowed"
                        >
                          <option value="">Sem proposta vinculada</option>
                          {propostasAprovadasDaEmpresa.map((proposta) => (
                            <option key={proposta.idProposta} value={proposta.idProposta}>
                              {getPropostaFileNameFromUrl(proposta.url)}
                              {proposta.valuation != null ? ` · ${formatCurrency(Number(proposta.valuation))}` : ""}
                            </option>
                          ))}
                        </select>
                        {selectedProposal && (
                          <p className="mt-1.5 rounded-md border border-accent/20 bg-accent/5 px-2 py-1.5 text-[11px] text-accent">
                            Serviço da proposta: <strong>{getServiceLabel(selectedProposal.servico)}</strong>
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Responsável</label>
                        <select
                          value={selectedResponsavelId}
                          onChange={(e) => {
                            const nextResponsavelId = Number(e.target.value);
                            setSelectedResponsavelId(e.target.value);
                            if (Number.isFinite(nextResponsavelId) && nextResponsavelId > 0) {
                              setSelectedParticipanteIds((current) =>
                                current.includes(nextResponsavelId) ? current : [...current, nextResponsavelId],
                              );
                            }
                            setUploadError("");
                          }}
                          className="w-full h-9 px-2.5 rounded-lg border border-border/25 bg-background/50 text-[12px] outline-none focus:border-accent/40 transition-colors text-foreground"
                        >
                          <option value="">Selecione o responsável</option>
                          {usuariosAtivos.map((usuario) => (
                            <option key={usuario.id} value={usuario.id}>{usuario.nomeCompleto}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Atores</label>
                        <div className="max-h-[120px] overflow-y-auto rounded-lg border border-border/25 bg-background/50 p-2">
                          {usuariosAtivos.map((usuario) => {
                            const checked = selectedParticipanteIds.includes(usuario.id);
                            return (
                              <label key={usuario.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-foreground/75 hover:bg-muted/20">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setSelectedParticipanteIds((current) =>
                                      e.target.checked
                                        ? Array.from(new Set([...current, usuario.id]))
                                        : current.filter((id) => id !== usuario.id),
                                    );
                                    setUploadError("");
                                  }}
                                  className="h-3.5 w-3.5 rounded border-border/40 accent-[hsl(var(--accent))]"
                                />
                                <span className="truncate">{usuario.nomeCompleto}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {files.length > 0 && (
                        <motion.div className="mt-3 space-y-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          {files.map((f, i) => (
                            <motion.div key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/20 bg-background/40" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ delay: i * 0.04 }}>
                              <FileIcon className="w-4 h-4 text-accent shrink-0" />
                              <span className="flex-1 text-[12px] text-foreground/80 truncate">{f.name}</span>
                              <span className="text-[10px] text-muted-foreground/40 shrink-0">{formatBytes(f.size)}</span>
                              <button onClick={() => removeFile(i)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted/30 text-muted-foreground/40 hover:text-foreground transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <motion.button onClick={() => { setUploadOpen(false); setFiles([]); setUploadDone(false); setUploadError(""); setSelectedEmpresaId(""); setSelectedPropostaId(""); setSelectedResponsavelId(""); setSelectedParticipanteIds([]); }} className="h-8 px-4 rounded-lg border border-border/30 text-[12px] text-muted-foreground hover:text-foreground transition-all" whileTap={{ scale: 0.97 }}>
                        Cancelar
                      </motion.button>
                      <motion.button onClick={handleUpload} disabled={files.length === 0 || uploading} className="h-8 px-5 rounded-lg bg-accent text-white text-[12px] font-medium hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed" whileTap={{ scale: 0.97 }}>
                        {uploading ? "Enviando..." : "Enviar"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-6 pb-4">
            <AnimatePresence>
              {actionMessage && (
                <motion.div className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] ${actionMessage.type === "error" ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-accent/20 bg-accent/5 text-accent"}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  {actionMessage.type === "error" ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{actionMessage.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-1 h-9 rounded-lg border border-border/25 bg-card/30 overflow-hidden w-fit">
              {tabs.map(t => (
                <motion.button key={t} onClick={() => setActiveTab(t)} className={`h-full px-4 text-[12px] font-medium transition-all ${activeTab === t ? "bg-accent/15 text-accent" : "text-muted-foreground/50 hover:text-foreground"}`} whileTap={{ scale: 0.97 }}>
                  {t}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="px-6 pb-6">
            <motion.div className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-[1fr_1fr_120px_132px] px-5 py-2.5 border-b border-border/15 bg-muted/5">
                <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider">Contrato</span>
                <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider">Empresa</span>
                <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider">Status</span>
                <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider">Ações</span>
              </div>
              <div className="divide-y divide-border/10 max-h-[calc(100vh-260px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                {isLoading ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground/50">Carregando contratos...</div>
                ) : error ? (
                  <div className="py-12 text-center text-[12px] text-destructive">Erro ao carregar contratos</div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground/30">Nenhum contrato encontrado</div>
                ) : (
                  filtered.map((c, i) => (
                    <motion.div key={c.id} className="grid grid-cols-[1fr_1fr_120px_132px] items-center px-5 py-4 hover:bg-muted/10 transition-colors cursor-pointer group" onClick={() => openContratoModal(c)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} whileHover={{ x: 2 }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-foreground/80 group-hover:text-accent transition-colors truncate">{c.titulo}</p>
                          <p className="text-[10px] text-muted-foreground/40 truncate">CT-{c.id}{c.propostaTitulo ? ` · ${c.propostaTitulo}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <p className="text-[12px] text-foreground/60 truncate">{c.empresaNome}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full w-fit ${statusStyles[c.status] || "bg-muted/10 text-muted-foreground"}`}>{c.status}</span>
                      <div className="flex items-center gap-1.5">
                        <button type="button" title="Aprovar contrato" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(c, "APROVADO"); }} disabled={c.status !== "PENDENTE" || updateContratoStatus.isPending} className="w-7 h-7 rounded-lg border border-border/25 flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-colors disabled:opacity-35 disabled:cursor-not-allowed">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" title="Rejeitar contrato" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(c, "REJEITADO"); }} disabled={c.status !== "PENDENTE" || updateContratoStatus.isPending} className="w-7 h-7 rounded-lg border border-border/25 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-colors disabled:opacity-35 disabled:cursor-not-allowed">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" title="Ver histórico" onClick={(e) => { e.stopPropagation(); handleOpenHistory(c); }} className="w-7 h-7 rounded-lg border border-border/25 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40 hover:bg-muted/20 transition-colors">
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selectedContrato && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setSelectedContrato(null)} />
            <motion.div className="relative z-10 w-full max-w-lg rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden" initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}>
              <div className="flex items-center justify-between p-5 border-b border-border/20">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">CT-{selectedContrato.id}</h2>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">{selectedContrato.titulo}</p>
                </div>
                <motion.button onClick={() => setSelectedContrato(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><X className="w-4 h-4" /></motion.button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border/20 bg-background/50 p-4">
                    <p className="text-[10px] text-muted-foreground/40 mb-1 uppercase tracking-wider">Empresa</p>
                    <p className="text-[13px] font-semibold text-foreground/80">{selectedContrato.empresaNome}</p>
                  </div>
                  <div className="rounded-lg border border-border/20 bg-background/50 p-4">
                    <p className="text-[10px] text-muted-foreground/40 mb-1 uppercase tracking-wider">Status</p>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-block ${statusStyles[selectedContrato.status] || "bg-muted/10 text-muted-foreground"}`}>{selectedContrato.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground/40 mb-2 uppercase tracking-wider">Vínculo</p>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border/20 bg-background/50 px-3 py-2">
                    <p className="min-w-0 truncate text-[12px] text-foreground/70">
                      {selectedContrato.propostaTitulo || "Sem proposta vinculada"}
                    </p>
                    {selectedContrato.propostaId && (
                      <button
                        type="button"
                        onClick={() => handleDesvincularProposta(selectedContrato)}
                        disabled={desvincularPropostaContrato.isPending}
                        className="shrink-0 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {desvincularPropostaContrato.isPending ? "Desvinculando..." : "Desvincular"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-border/20 bg-background/50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Responsável e atores</p>
                    {!responsaveisEditOpen ? (
                      <button
                        type="button"
                        onClick={() => handleStartEditResponsaveis(selectedContrato)}
                        className="rounded-md border border-border/25 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
                      >
                        Editar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setResponsaveisEditOpen(false);
                          setModalError("");
                        }}
                        className="rounded-md border border-border/25 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  {!responsaveisEditOpen ? (
                    <div className="space-y-3">
                      <div>
                        <p className="mb-1 text-[10px] text-muted-foreground/40">Responsável</p>
                        <p className="text-[12px] font-semibold text-foreground/80">{selectedContrato.responsavelNome || "Não definido"}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] text-muted-foreground/40">Atores</p>
                        {selectedContrato.participantes.length === 0 ? (
                          <p className="text-[12px] text-muted-foreground/45">Nenhum ator vinculado</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedContrato.participantes.map((participante) => (
                              <span key={participante.id} className="rounded-full border border-border/25 bg-muted/20 px-2 py-1 text-[10px] text-foreground/70">
                                {participante.nomeCompleto}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[10px] text-muted-foreground/40">Responsável</label>
                        <select
                          value={editResponsavelId}
                          onChange={(e) => {
                            const nextResponsavelId = Number(e.target.value);
                            setEditResponsavelId(e.target.value);
                            if (Number.isFinite(nextResponsavelId) && nextResponsavelId > 0) {
                              setEditParticipanteIds((current) =>
                                current.includes(nextResponsavelId) ? current : [...current, nextResponsavelId],
                              );
                            }
                            setModalError("");
                          }}
                          className="h-9 w-full rounded-lg border border-border/25 bg-background/50 px-2.5 text-[12px] text-foreground outline-none transition-colors focus:border-accent/40"
                        >
                          <option value="">Selecione o responsável</option>
                          {usuariosAtivos.map((usuario) => (
                            <option key={usuario.id} value={usuario.id}>{usuario.nomeCompleto}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] text-muted-foreground/40">Atores</p>
                        <div className="max-h-[130px] overflow-y-auto rounded-lg border border-border/25 bg-background/50 p-2">
                          {usuariosAtivos.map((usuario) => {
                            const checked = editParticipanteIds.includes(usuario.id);
                            return (
                              <label key={usuario.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-foreground/75 hover:bg-muted/20">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setEditParticipanteIds((current) =>
                                      e.target.checked
                                        ? Array.from(new Set([...current, usuario.id]))
                                        : current.filter((id) => id !== usuario.id),
                                    );
                                    setModalError("");
                                  }}
                                  className="h-3.5 w-3.5 rounded border-border/40 accent-[hsl(var(--accent))]"
                                />
                                <span className="truncate">{usuario.nomeCompleto}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveResponsaveis}
                        disabled={updateContratoResponsaveis.isPending}
                        className="h-9 w-full rounded-lg bg-accent text-[12px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updateContratoResponsaveis.isPending ? "Salvando..." : "Salvar responsável e atores"}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <motion.button onClick={() => handleOpenContrato(selectedContrato)} disabled={!selectedContrato.urlPdf} className="flex-1 h-10 rounded-lg bg-accent text-accent-foreground text-[12px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed" whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                    Ver Contrato
                  </motion.button>
                  <motion.button onClick={() => handleOpenProposta(selectedContrato)} disabled={!selectedContrato.propostaId} className="flex-1 h-10 rounded-lg border border-border/30 bg-background/60 text-foreground/75 text-[12px] font-semibold hover:border-accent/40 hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed" whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                    Ver Proposta
                  </motion.button>
                </div>
                <motion.button onClick={() => setReviewContratoId(selectedContrato.id)} className="h-10 w-full rounded-lg border border-accent/30 bg-accent/5 text-accent text-[12px] font-semibold" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  Revisão do cliente
                </motion.button>
                {modalError && <p className="text-[12px] text-destructive">{modalError}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {historyOpen && historyContrato && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setHistoryOpen(false)} />
            <motion.div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden" initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}>
              <div className="flex items-center justify-between p-5 border-b border-border/20">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">Histórico do contrato</h2>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">CT-{historyContrato.id}</p>
                </div>
                <motion.button onClick={() => setHistoryOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><X className="w-4 h-4" /></motion.button>
              </div>
              <div className="p-5">
                {historyLoading ? (
                  <div className="py-10 text-center text-[12px] text-muted-foreground/50">Carregando histórico...</div>
                ) : historyError ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">{historyError}</div>
                ) : historyItems.length === 0 ? (
                  <div className="py-10 text-center text-[12px] text-muted-foreground/40">Nenhuma alteração de status registrada</div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {historyItems.map((item) => (
                      <div key={item.idHistorico} className="rounded-lg border border-border/20 bg-background/50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${statusStyles[item.statusAnterior] || "bg-muted/10 text-muted-foreground"}`}>{item.statusAnterior}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                            <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${statusStyles[item.statusNovo] || "bg-muted/10 text-muted-foreground"}`}>{item.statusNovo}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground/50 shrink-0">{formatDateTime(item.dataAlteracao)}</span>
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground/45">{item.usuarioNome || `Usuário #${item.usuarioId}`}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <RevisaoDocumentoDialog open={reviewContratoId !== null} tipo="CONTRATO" referenciaId={reviewContratoId} onClose={() => setReviewContratoId(null)} />
    </div>
  );
};

export default Contratos;
