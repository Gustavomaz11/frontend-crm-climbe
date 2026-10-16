import { AppSidebar } from "@/components/layout/AppSidebar";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSidebarState } from "@/hooks/useSidebarState";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, AlertCircle, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AppHeaderUser } from "@/components/layout/AppHeaderUser";

import { PermissionGroupsPanel } from "@/components/permissions/PermissionGroupsPanel";
import { UserIdentity } from "@/components/users/UserSelect";
import { useAuthStore } from "@/store/useAuthStore";
import { useCreateUsuarioPermissao, useDeleteUsuarioPermissao, usePermissoes, useUsuarioPermissoes, useUsuarios, type Permissao } from "@/services";

function getPermissaoGroup(permissao: Permissao) {
  if (permissao.codigo.startsWith("JURIDICO_CONTRATO_")) return "Jurídico";
  if (permissao.codigo.includes("COMERCIAL")) return "Comercial";
  if (permissao.codigo.includes("CONTRATO")) return "Contratos";
  if (permissao.codigo.includes("PROPOSTA")) return "Propostas";
  if (permissao.codigo.includes("DOCUMENTO") || permissao.codigo.includes("ARQUIVO")) return "Documentos e Arquivos";
  if (permissao.codigo.includes("REUNIAO")) return "Agenda";
  if (permissao.codigo.includes("RELATORIO") || permissao.codigo.includes("PLANILHA")) return "Relatórios e Planilhas";
  if (permissao.codigo.includes("CARGO") || permissao.codigo.includes("ACESSO")) return "Administração";
  return "Outras";
}

interface PermissionQueueItem {
  usuarioId: number;
  permissaoId: number;
  codigo: string;
  associacaoId?: number;
  nextEnabled: boolean;
  previousEnabled: boolean;
}

const Permissoes = () => {
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const [userSearch, setUserSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [optimisticPermissionIds, setOptimisticPermissionIds] = useState<Set<number>>(new Set());
  const [pendingPermissionIds, setPendingPermissionIds] = useState<Set<number>>(new Set());
  const [syncLocked, setSyncLocked] = useState(false);
  const permissionQueueRef = useRef<PermissionQueueItem[]>([]);
  const processingQueueRef = useRef(false);
  const selectedUserIdRef = useRef<number | null>(null);
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

  const { data: usuarios = [], isLoading: loadingUsuarios, error: usuariosError } = useUsuarios();
  const { data: permissoes = [], isLoading: loadingPermissoes, error: permissoesError } = usePermissoes();
  const { data: usuarioPermissoes = [], isLoading: loadingUsuarioPermissoes } = useUsuarioPermissoes(selectedUserId ?? undefined);
  const createUsuarioPermissao = useCreateUsuarioPermissao();
  const deleteUsuarioPermissao = useDeleteUsuarioPermissao();

  const filteredUsers = useMemo(() => {
    const query = userSearch.toLowerCase();
    return usuarios.filter((usuario) =>
      usuario.nomeCompleto.toLowerCase().includes(query) ||
      usuario.email.toLowerCase().includes(query) ||
      usuario.cargo.toLowerCase().includes(query),
    );
  }, [usuarios, userSearch]);

  const selectedUser = useMemo(
    () => usuarios.find((usuario) => usuario.id === selectedUserId) ?? null,
    [selectedUserId, usuarios],
  );

  const associacaoPorPermissaoId = useMemo(() => {
    const map = new Map<number, (typeof usuarioPermissoes)[number]>();
    usuarioPermissoes.forEach((associacao) => {
      map.set(associacao.permissao.id, associacao);
    });
    return map;
  }, [usuarioPermissoes]);

  const filteredPermissoes = useMemo(() => {
    const query = permissionSearch.toLowerCase();
    return permissoes.filter((permissao) =>
      permissao.nome.toLowerCase().includes(query) ||
      permissao.codigo.toLowerCase().includes(query) ||
      permissao.descricao.toLowerCase().includes(query),
    );
  }, [permissionSearch, permissoes]);

  const permissoesGrouped = useMemo(() => {
    return filteredPermissoes.reduce<Record<string, Permissao[]>>((acc, permissao) => {
      const group = getPermissaoGroup(permissao);
      acc[group] = [...(acc[group] ?? []), permissao];
      return acc;
    }, {});
  }, [filteredPermissoes]);

  const enabledCount = usuarioPermissoes.length;
  const isLoading = loadingUsuarios || loadingPermissoes;
  const hasError = usuariosError || permissoesError;

  useEffect(() => {
    if (!selectedUserId && usuarios.length > 0) {
      setSelectedUserId(usuarios[0].id);
    }
  }, [selectedUserId, usuarios]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    if (pendingPermissionIds.size > 0 || syncLocked) return;
    setOptimisticPermissionIds(new Set(usuarioPermissoes.map((associacao) => associacao.permissao.id)));
  }, [pendingPermissionIds.size, selectedUserId, syncLocked, usuarioPermissoes]);

  async function processPermissionQueue() {
    if (processingQueueRef.current) return;

    processingQueueRef.current = true;
    setSyncLocked(true);
    const failedCodes: string[] = [];

    try {
      while (permissionQueueRef.current.length > 0) {
        const item = permissionQueueRef.current.shift();
        if (!item) continue;

        try {
          if (item.nextEnabled) {
            await createUsuarioPermissao.mutateAsync({
              usuarioId: item.usuarioId,
              permissaoId: item.permissaoId,
              invalidate: false,
            });
          } else if (item.associacaoId) {
            await deleteUsuarioPermissao.mutateAsync({
              usuarioId: item.usuarioId,
              associacaoId: item.associacaoId,
              invalidate: false,
            });
          } else {
            throw new Error("Associação da permissão não encontrada.");
          }
        } catch {
          failedCodes.push(item.codigo);

          if (selectedUserIdRef.current === item.usuarioId) {
            setOptimisticPermissionIds((current) => {
              const next = new Set(current);
              if (item.previousEnabled) {
                next.add(item.permissaoId);
              } else {
                next.delete(item.permissaoId);
              }
              return next;
            });
          }
        } finally {
          setPendingPermissionIds((current) => {
            const next = new Set(current);
            next.delete(item.permissaoId);
            return next;
          });
        }
      }
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["usuario-permissoes"] });
      await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      processingQueueRef.current = false;
      setSyncLocked(false);

      if (failedCodes.length > 0) {
        setFeedback({
          type: "error",
          text: `Não foi possível salvar: ${failedCodes.join(", ")}.`,
        });
      } else {
        setFeedback({ type: "success", text: "Permissões salvas." });
      }
    }
  }

  function handleTogglePermission(permissao: Permissao) {
    if (!selectedUserId || pendingPermissionIds.has(permissao.id)) return;

    const associacao = associacaoPorPermissaoId.get(permissao.id);
    const wasEnabled = optimisticPermissionIds.has(permissao.id);
    const nextEnabled = !wasEnabled;

    setFeedback(null);
    setOptimisticPermissionIds((current) => {
      const next = new Set(current);
      if (nextEnabled) {
        next.add(permissao.id);
      } else {
        next.delete(permissao.id);
      }
      return next;
    });
    setPendingPermissionIds((current) => new Set(current).add(permissao.id));

    permissionQueueRef.current.push({
      usuarioId: selectedUserId,
      permissaoId: permissao.id,
      codigo: permissao.codigo,
      associacaoId: associacao?.id,
      nextEnabled,
      previousEnabled: wasEnabled,
    });

    void processPermissionQueue();
  }

  return (
    <div className="app-layout relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, hsl(var(--accent) / 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--primary) / 0.03) 0%, transparent 50%)` }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />

        <main className="app-main" data-collapsed={sidebarCollapsed}>
          <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b border-border/20 bg-background/80 backdrop-blur-xl">
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border/25 bg-card/30 backdrop-blur-sm text-muted-foreground w-full min-w-0 max-w-[300px]">
              <Search className="w-3.5 h-3.5" />
              <input type="text" placeholder="Buscar usuário..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground text-foreground" />
            </div>
            <AppHeaderUser name={userName} photoUrl={userPhoto} />
          </header>

          <div className="px-6 pt-6 pb-2">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">Permissões por Usuário</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">Controle individual das políticas de acesso aplicadas a cada usuário.</p>
          </div>

          <div className="px-6 pb-6 space-y-3">
            <PermissionGroupsPanel permissoes={permissoes} />
            <AnimatePresence>
              {feedback && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] ${feedback.type === "success" ? "border-accent/25 bg-accent/10 text-accent" : "border-destructive/25 bg-destructive/10 text-destructive"}`}>
                  {feedback.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {feedback.text}
                </motion.div>
              )}
            </AnimatePresence>

            {hasError ? (
              <div className="rounded-xl border border-destructive/20 bg-card/40 p-8 text-center text-[13px] text-destructive">
                Erro ao carregar usuários ou permissões.
              </div>
            ) : isLoading ? (
              <div className="rounded-xl border border-border/25 bg-card/40 p-8 text-center text-[13px] text-muted-foreground">
                Carregando políticas de acesso...
              </div>
            ) : (
              <div className="grid grid-cols-[320px_1fr] gap-5">
                <motion.section className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="border-b border-border/15 p-4">
                    <p className="text-[13px] font-semibold text-foreground">Usuários</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{filteredUsers.length} de {usuarios.length}</p>
                  </div>
                  <div className="max-h-[calc(100vh-250px)] divide-y divide-border/10 overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                    {filteredUsers.map((usuario, index) => {
                      const selected = usuario.id === selectedUserId;
                      return (
                        <motion.button
                          key={usuario.id}
                          type="button"
                          onClick={() => setSelectedUserId(usuario.id)}
                          className={`w-full text-left px-4 py-3 transition-colors ${selected ? "bg-accent/10" : "hover:bg-muted/10"}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.025 }}
                        >
                          <div className="flex items-center gap-3">
                            <UserIdentity
                              user={usuario}
                              className="min-w-0 flex-1"
                              avatarClassName={selected ? "border-accent/35 bg-accent/20" : undefined}
                            />
                          </div>
                        </motion.button>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">Nenhum usuário encontrado</div>
                    )}
                  </div>
                </motion.section>

                <motion.section className="rounded-xl border border-border/25 bg-card/40 backdrop-blur-sm overflow-hidden" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <div className="border-b border-border/15 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                            <LockKeyhole className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate text-[16px] font-semibold text-foreground">{selectedUser?.nomeCompleto || "Selecione um usuário"}</h2>
                            <p className="truncate text-[11px] text-muted-foreground">{selectedUser?.email || "—"}</p>
                            {selectedUser?.situacao === "COMPLETAR_CADASTRO" && (
                              <p className="mt-1 text-[11px] text-yellow-500">Aprovado. Aguardando completar o cadastro no primeiro acesso.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-border/20 bg-background/45 px-3 py-2 text-right">
                        <p className="text-[18px] font-bold leading-none text-foreground">{optimisticPermissionIds.size}</p>
                        <p className="mt-1 text-[9px] uppercase tracking-[0.08em] text-muted-foreground">habilitadas</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 h-9 px-3 rounded-lg border border-border/25 bg-background/50 text-muted-foreground">
                      <Search className="w-3.5 h-3.5" />
                      <input type="text" placeholder="Buscar permissão..." value={permissionSearch} onChange={(e) => setPermissionSearch(e.target.value)} className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground text-foreground" />
                    </div>
                  </div>

                  <div className="max-h-[calc(100vh-330px)] overflow-y-auto p-5 space-y-5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                    {!selectedUser ? (
                      <div className="py-12 text-center text-[12px] text-muted-foreground">Nenhum usuário selecionado</div>
                    ) : loadingUsuarioPermissoes ? (
                      <div className="py-12 text-center text-[12px] text-muted-foreground">Carregando permissões do usuário...</div>
                    ) : Object.keys(permissoesGrouped).length === 0 ? (
                      <div className="py-12 text-center text-[12px] text-muted-foreground">Nenhuma permissão encontrada</div>
                    ) : (
                      Object.entries(permissoesGrouped).map(([group, groupPermissoes]) => (
                        <div key={group} className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{group}</p>
                          <div className="space-y-2">
                            {groupPermissoes.map((permissao) => {
                              const enabled = optimisticPermissionIds.has(permissao.id);
                              const pending = pendingPermissionIds.has(permissao.id);
                              return (
                                <div key={permissao.id} className={`flex items-center gap-4 rounded-lg border border-border/20 bg-background/45 px-4 py-3 transition-opacity ${pending ? "opacity-75" : ""}`}>
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePermission(permissao)}
                                    disabled={pending}
                                    className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${enabled ? "border-accent/40 bg-accent/25" : "border-border/30 bg-muted/25"}`}
                                    title={pending ? "Atualizando permissão" : enabled ? "Desabilitar permissão" : "Habilitar permissão"}
                                  >
                                    <span className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-colors ${enabled ? "left-6 bg-accent" : "left-1 bg-muted-foreground/45"}`} />
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-[13px] font-medium text-foreground/85">{permissao.nome}</p>
                                      <span className="rounded-md border border-border/25 bg-card/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{permissao.codigo}</span>
                                    </div>
                                    {permissao.descricao && permissao.descricao !== permissao.nome && (
                                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{permissao.descricao}</p>
                                    )}
                                  </div>
                                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] ${enabled ? "bg-accent/10 text-accent" : "bg-muted/25 text-muted-foreground"}`}>
                                    {pending ? "Salvando" : enabled ? "Permitido" : "Negado"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Permissoes;
