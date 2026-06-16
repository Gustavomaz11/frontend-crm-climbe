import { useState, useMemo, useRef, useCallback } from "react";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, Calendar as CalendarIcon, Shield, Building2, Settings,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Search, Plus, FileCheck, X,
  UserCheck, UploadCloud, File as FileIcon, CheckCircle2, ScrollText,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { useContratos, useEmpresas, Contrato } from "@/services";
import { useAuthStore } from "@/store/useAuthStore";

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

const statusStyles: Record<string, string> = {
  "ATIVO": "bg-accent/10 text-accent",
  "ANALISE": "bg-primary/10 text-primary",
  "PENDENTE": "bg-destructive/10 text-destructive",
  "CONCLUIDO": "bg-accent/10 text-accent",
};

type FilterTab = "Todos" | "Ativos" | "Em análise" | "Pendente" | "Concluído";
const tabs: FilterTab[] = ["Todos", "Ativos", "Em análise", "Pendente", "Concluído"];

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const Contratos = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: contratos = [], isLoading, error } = useContratos();
  const { data: empresas = [] } = useEmpresas();
  const basicUserData = useAuthStore((state) => state.basicUserData);
  const userData = useAuthStore((state) => state.userData);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming).filter(
      (f) => !files.some((ex) => ex.name === f.name && ex.size === f.size)
    );
    setFiles((prev) => [...prev, ...next]);
    setUploadDone(false);
  }, [files]);

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  function handleFakeUpload() {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadDone(true);
      setFiles([]);
      setSelectedEmpresaId("");
    }, 1400);
  }

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

  const filtered = useMemo(() => {
    if (!contratos.length) return [];
    return contratos.filter(c => {
      const matchSearch = c.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.descricao?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [searchQuery, contratos]);

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)` }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <motion.aside className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-border/30 bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[220px]"}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className={`flex items-center h-16 border-b border-border/20 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
            {sidebarCollapsed ? <motion.div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center"><span className="text-accent font-bold text-xs">C</span></motion.div> : <ClimbLogo className="h-[16px] text-foreground" />}
          </div>
          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map(item => (
              <motion.button key={item.label} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-3 rounded-lg transition-all group relative ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"} ${item.label === "Contratos" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`} whileHover={{ x: sidebarCollapsed ? 0 : 2 }} whileTap={{ scale: 0.98 }}>
                {item.label === "Contratos" && <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" layoutId="activeNav" />}
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!sidebarCollapsed && <span className="text-[13px] font-medium">{item.label}</span>}
              </motion.button>
            ))}
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

        {/* Main */}
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
                onClick={() => { setUploadOpen(!uploadOpen); setUploadDone(false); }}
                className="h-9 px-4 rounded-lg bg-accent text-accent-foreground text-[12px] font-semibold flex items-center gap-2 shadow-[0_2px_10px_-2px_hsl(var(--accent)/0.3)]"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-3.5 h-3.5" /> Novo Contrato
              </motion.button>
            </div>

            {/* Upload zone */}
            <AnimatePresence>
              {uploadOpen && (
                <motion.div
                  className="mb-4 rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="p-4">
                    {/* Drop zone */}
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      accept={ACCEPTED}
                      className="hidden"
                      onChange={(e) => addFiles(e.target.files)}
                    />
                    <motion.div
                      onClick={() => inputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      animate={dragOver ? { scale: 1.01 } : { scale: 1 }}
                      className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-7 cursor-pointer transition-colors select-none ${
                        dragOver
                          ? "border-accent/60 bg-accent/5"
                          : "border-border/30 hover:border-accent/40 hover:bg-muted/10"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dragOver ? "bg-accent/15" : "bg-muted/20"}`}>
                        <UploadCloud className={`w-5 h-5 transition-colors ${dragOver ? "text-accent" : "text-muted-foreground/50"}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] font-medium text-foreground/80">
                          {dragOver ? "Solte os arquivos aqui" : "Clique para selecionar ou arraste o arquivo"}
                        </p>
                        <p className="text-[11px] text-muted-foreground/40 mt-0.5">PDF, DOC, DOCX, XLS, XLSX</p>
                      </div>
                    </motion.div>

                    {/* Empresa select */}
                    <div className="mt-3">
                      <label className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider mb-1 block">Empresa</label>
                      <select
                        value={selectedEmpresaId}
                        onChange={(e) => setSelectedEmpresaId(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-border/25 bg-background/50 text-[12px] outline-none focus:border-accent/40 transition-colors text-foreground"
                      >
                        <option value="">Selecione a empresa</option>
                        {empresas.map((empresa) => (
                          <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* File list */}
                    <AnimatePresence>
                      {files.length > 0 && (
                        <motion.div
                          className="mt-3 space-y-1.5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {files.map((f, i) => (
                            <motion.div
                              key={`${f.name}-${i}`}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/20 bg-background/40"
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 8 }}
                              transition={{ delay: i * 0.04 }}
                            >
                              <FileIcon className="w-4 h-4 text-accent shrink-0" />
                              <span className="flex-1 text-[12px] text-foreground/80 truncate">{f.name}</span>
                              <span className="text-[10px] text-muted-foreground/40 shrink-0">{formatBytes(f.size)}</span>
                              <button
                                onClick={() => removeFile(i)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted/30 text-muted-foreground/40 hover:text-foreground transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <AnimatePresence>
                        {uploadDone && (
                          <motion.span
                            className="flex items-center gap-1.5 text-[12px] text-accent mr-auto"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Enviado com sucesso!
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <motion.button
                        onClick={() => { setUploadOpen(false); setFiles([]); setUploadDone(false); setSelectedEmpresaId(""); }}
                        className="h-8 px-4 rounded-lg border border-border/30 text-[12px] text-muted-foreground hover:text-foreground transition-all"
                        whileTap={{ scale: 0.97 }}
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={handleFakeUpload}
                        disabled={files.length === 0 || uploading}
                        className="h-8 px-5 rounded-lg bg-accent text-white text-[12px] font-medium hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        whileTap={{ scale: 0.97 }}
                      >
                        {uploading ? "Enviando..." : "Enviar"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tabs */}
          <div className="px-6 pb-4">
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
              <div className="divide-y divide-border/10 max-h-[calc(100vh-220px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                {isLoading ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground/50">Carregando contratos...</div>
                ) : error ? (
                  <div className="py-12 text-center text-[12px] text-destructive">Erro ao carregar contratos</div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground/30">Nenhum contrato encontrado</div>
                ) : (
                  filtered.map((c, i) => (
                    <motion.div
                      key={c.id}
                      className="px-5 py-4 hover:bg-muted/10 transition-colors cursor-pointer group border-b border-border/5 last:border-0"
                      onClick={() => setSelectedContrato(c)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ x: 2 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-[12px] font-semibold text-foreground">CT-{c.id}</p>
                          <p className="text-[11px] text-foreground/70 group-hover:text-accent transition-colors">{c.titulo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[12px] font-medium text-foreground/80">R$ {c.valor}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit inline-block ${statusStyles[c.status] || "bg-muted/10 text-muted-foreground"}`}>{c.status}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Detail Modal */}
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
                    <p className="text-[10px] text-muted-foreground/40 mb-1 uppercase tracking-wider">Valor</p>
                    <p className="text-[14px] font-semibold text-accent">R$ {selectedContrato.valor}</p>
                  </div>
                  <div className="rounded-lg border border-border/20 bg-background/50 p-4">
                    <p className="text-[10px] text-muted-foreground/40 mb-1 uppercase tracking-wider">Status</p>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-block ${statusStyles[selectedContrato.status]}`}>{selectedContrato.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground/40 mb-2 uppercase tracking-wider">Descrição</p>
                  <p className="text-[12px] text-foreground/70">{selectedContrato.descricao || "Sem descrição"}</p>
                </div>
                <div className="flex gap-2">
                  <motion.button className="flex-1 h-10 rounded-lg bg-accent text-accent-foreground text-[12px] font-semibold" whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>Ver Contrato</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Contratos;
