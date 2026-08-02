import { useState, useMemo } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useSidebarState } from "@/hooks/useSidebarState";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, Calendar as CalendarIcon, Shield, Building2, Settings,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Search, Download, Eye, X, FileCheck, UserCheck, Plus, ScrollText,
  Pencil, Trash2, AlertTriangle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClimbLogo from "@/components/login/ClimbLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import { useAuthStore } from "@/store/useAuthStore";
import { getServiceLabel, useAlterarVencimentoParcela, useDeleteEmpresa, useEmpresaFinanceiro, useEmpresas, Empresa } from "@/services";
import { toast } from "sonner";

const Empresas = () => {
  const { isDark, setIsDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const navigate = useNavigate();

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

  const { data: empresas = [], isLoading, error } = useEmpresas();
  const { data: financeiro, isLoading: isLoadingFinanceiro } = useEmpresaFinanceiro(selectedEmpresa?.id ?? 0);
  const alterarVencimento = useAlterarVencimentoParcela(selectedEmpresa?.id ?? 0);
  const { mutate: deleteEmpresa, isPending: isDeleting } = useDeleteEmpresa();

  const filtered = useMemo(() => {
    if (!empresas.length) return [];
    const query = searchQuery.trim().toLowerCase();
    return empresas.filter((empresa) =>
      [empresa.nome, empresa.razaoSocial, empresa.cnpj, empresa.email]
        .some((value) => value?.toLowerCase().includes(query))
    );
  }, [searchQuery, empresas]);

  const requestDelete = (empresa: Empresa) => {
    setSelectedEmpresa(null);
    setEmpresaToDelete(empresa);
  };

  const confirmDelete = () => {
    if (!empresaToDelete) return;

    deleteEmpresa(empresaToDelete.id, {
      onSuccess: () => {
        toast.success("Empresa excluída com sucesso.");
        setEmpresaToDelete(null);
      },
      onError: (deleteError) => {
        const message = deleteError instanceof Error
          ? deleteError.message
          : "Não foi possível excluir a empresa.";
        toast.error(message);
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)` }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
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

        {/* Main */}
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[220px]"}`}>
          <motion.header className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b border-border/20 bg-background/80 backdrop-blur-xl" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border/25 bg-card/30 backdrop-blur-sm text-muted-foreground/50 w-[280px]">
              <Search className="w-3.5 h-3.5" />
              <input type="text" placeholder="Buscar empresa..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/30 text-foreground" />
            </div>
            <UserAvatar name={userName} photoUrl={userPhoto} />
          </motion.header>

          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-foreground tracking-tight">Empresas</h1>
              <p className="text-[12px] text-muted-foreground/50 mt-0.5">Gerencie todas as empresas — pendentes e clientes.</p>
            </div>
            <motion.button
              onClick={() => navigate("/empresas/cadastro")}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent/90 transition-all"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus className="w-4 h-4" />
              Cadastrar Novo
            </motion.button>
          </div>

          <div className="px-6 pb-6">
            <motion.div className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <div className="divide-y divide-border/10 max-h-[calc(100vh-220px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                {isLoading ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground/50">Carregando empresas...</div>
                ) : error ? (
                  <div className="py-12 text-center text-[12px] text-destructive">Erro ao carregar empresas</div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-[12px] text-muted-foreground/30">Nenhuma empresa encontrada</div>
                ) : (
                  filtered.map((emp, i) => (
                    <motion.div
                      key={emp.id}
                      className="px-5 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors cursor-pointer group"
                      onClick={() => setSelectedEmpresa(emp)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 text-accent">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-foreground group-hover:text-accent transition-colors">{emp.nome}</p>
                          <p className="text-[10px] text-muted-foreground/40">{emp.cnpj} · {emp.cidade || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-medium px-2.5 py-0.5 rounded-full bg-accent/10 text-accent">
                          Ativa
                        </span>
                        <button
                          type="button"
                          title="Editar empresa"
                          aria-label={`Editar ${emp.nome}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/empresas/${emp.id}/editar`);
                          }}
                          className="w-8 h-8 rounded-lg border border-border/20 flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/30 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Excluir empresa"
                          aria-label={`Excluir ${emp.nome}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            requestDelete(emp);
                          }}
                          className="w-8 h-8 rounded-lg border border-border/20 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Detail modal */}
      <AnimatePresence>
        {selectedEmpresa && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setSelectedEmpresa(null)} />
            <motion.div className="relative z-10 w-full max-w-5xl max-h-[85vh] rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col" initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}>
              <div className="flex items-center justify-between p-5 border-b border-border/20">
                <h2 className="text-[16px] font-semibold text-foreground">{selectedEmpresa.nome}</h2>
                <motion.button onClick={() => setSelectedEmpresa(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><X className="w-4 h-4" /></motion.button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/20 bg-background/50 p-5 space-y-3">
                    <p className="text-[10px] text-muted-foreground/40 font-medium tracking-[0.08em] uppercase">Informações</p>
                    <div className="space-y-3">
                      <div><p className="text-[10px] text-muted-foreground/40">CNPJ</p><p className="text-[13px] text-foreground/80">{selectedEmpresa.cnpj || "N/A"}</p></div>
                      <div><p className="text-[10px] text-muted-foreground/40">Email</p><p className="text-[13px] text-foreground/80">{selectedEmpresa.email || "N/A"}</p></div>
                      <div><p className="text-[10px] text-muted-foreground/40">Telefone</p><p className="text-[13px] text-foreground/80">{selectedEmpresa.telefone || "N/A"}</p></div>
                      <div><p className="text-[10px] text-muted-foreground/40">Cidade</p><p className="text-[13px] text-foreground/80">{selectedEmpresa.cidade || "N/A"}</p></div>
                      <div><p className="text-[10px] text-muted-foreground/40">Endereço</p><p className="text-[13px] text-foreground/80">{selectedEmpresa.logradouro || "N/A"}{selectedEmpresa.numero ? `, ${selectedEmpresa.numero}` : ""}</p></div>
                      <div><p className="text-[10px] text-muted-foreground/40">Representante</p><p className="text-[13px] text-foreground/80">{selectedEmpresa.representanteNome || "N/A"}</p></div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/20 bg-background/50 p-5 space-y-3">
                    <p className="text-[10px] text-muted-foreground/40 font-medium tracking-[0.08em] uppercase">Ações</p>
                    <div className="space-y-2">
                      <motion.button className="w-full h-10 rounded-lg border border-border/25 bg-card/40 text-[12px] text-foreground/70 flex items-center justify-center gap-2 hover:border-accent/30 hover:text-accent transition-all" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}><Download className="w-4 h-4" /> Documentos</motion.button>
                      <motion.button className="w-full h-10 rounded-lg border border-border/25 bg-card/40 text-[12px] text-foreground/70 flex items-center justify-center gap-2 hover:border-accent/30 hover:text-accent transition-all" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}><Eye className="w-4 h-4" /> Histórico</motion.button>
                      <motion.button
                        type="button"
                        onClick={() => navigate(`/empresas/${selectedEmpresa.id}/editar`)}
                        className="w-full h-10 rounded-lg border border-border/25 bg-card/40 text-[12px] text-foreground/70 flex items-center justify-center gap-2 hover:border-accent/30 hover:text-accent transition-all"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Pencil className="w-4 h-4" /> Editar informações
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => requestDelete(selectedEmpresa)}
                        className="w-full h-10 rounded-lg border border-destructive/20 bg-destructive/5 text-[12px] text-destructive flex items-center justify-center gap-2 hover:bg-destructive/10 transition-all"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Trash2 className="w-4 h-4" /> Excluir empresa
                      </motion.button>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/20 bg-background/50 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/40">Serviços e recebimentos</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">Contratos, parcelas e equipe vinculada por serviço.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground/40">Próximo recebimento</p>
                      <p className="text-sm font-semibold text-accent">{financeiro?.proximoRecebimentoValor != null ? financeiro.proximoRecebimentoValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{financeiro?.proximoRecebimentoData ? new Date(`${financeiro.proximoRecebimentoData}T12:00:00`).toLocaleDateString("pt-BR") : "Sem parcela pendente"}</p>
                    </div>
                  </div>
                  {isLoadingFinanceiro ? (
                    <p className="py-5 text-center text-xs text-muted-foreground">Carregando serviços...</p>
                  ) : !financeiro?.servicos.length ? (
                    <p className="py-5 text-center text-xs text-muted-foreground">Nenhum serviço contratado.</p>
                  ) : (
                    <div className="space-y-3">
                      {financeiro.servicos.map((item) => (
                        <div key={item.contratoId} className="rounded-lg border border-border/20 bg-card/50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <strong className="text-[13px]">{getServiceLabel(item.servico)}</strong>
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.situacao === "ATIVO" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>{item.situacao}</span>
                            </div>
                            <span className="text-[12px] font-semibold">{Number(item.valorTotal || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {item.funcionarios.length ? item.funcionarios.map((pessoa) => <span key={pessoa.id} title={pessoa.email} className="rounded-full bg-muted/40 px-2 py-1 text-[10px] text-foreground/70">{pessoa.nome}</span>) : <span className="text-[10px] text-muted-foreground">Sem funcionários vinculados</span>}
                          </div>
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full min-w-[560px] text-left text-[10px]">
                              <thead className="text-muted-foreground"><tr><th className="py-1">Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr></thead>
                              <tbody>{item.parcelas.map((parcela) => <tr key={parcela.id} className="border-t border-border/15"><td className="py-1.5">{parcela.numero}</td><td><input type="date" defaultValue={parcela.vencimento} disabled={alterarVencimento.isPending} onBlur={(event) => { if (event.target.value && event.target.value !== parcela.vencimento) alterarVencimento.mutate({ contratoId: item.contratoId, parcelaId: parcela.id, vencimento: event.target.value }); }} className="rounded border border-border/20 bg-transparent px-1 py-0.5 text-[10px]" /></td><td>{Number(parcela.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td><td>{parcela.status}</td></tr>)}</tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {empresaToDelete && (
          <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={() => !isDeleting && setEmpresaToDelete(null)} />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-company-title"
              className="relative z-10 w-full max-w-md rounded-2xl border border-border/30 bg-card/95 p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
            >
              <div className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 id="delete-company-title" className="text-[16px] font-semibold text-foreground">Excluir empresa?</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground/60">
                A empresa <strong className="text-foreground/80">{empresaToDelete.nome}</strong> será excluída permanentemente. Empresas com contratos, propostas, documentos ou reuniões vinculados não podem ser excluídas.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setEmpresaToDelete(null)}
                  className="h-9 px-4 rounded-lg border border-border/30 text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-[12px] font-medium hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isDeleting ? "Excluindo..." : "Excluir empresa"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Empresas;
