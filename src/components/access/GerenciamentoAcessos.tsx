import { useMemo, useState } from "react";
import { Ban, CheckCircle2, Pencil, RotateCcw, Search, ShieldCheck, User } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  useAcessosUsuarios,
  useAlterarCargoUsuario,
  useCargos,
  useReativarAcesso,
  useRevogarAcesso,
  type Usuario,
} from "@/services/useUsuarios";

type FiltroAcesso = "todos" | "ATIVO" | "REVOGADO";
type AcaoAcesso = "revogar" | "reativar";

interface GerenciamentoAcessosProps {
  usuarioAtualId?: number;
}

const mensagemErro = (error: unknown) => {
  const response = error as { response?: { data?: { message?: string } }; message?: string };
  return response.response?.data?.message || response.message || "Não foi possível atualizar o acesso.";
};

export const GerenciamentoAcessos = ({ usuarioAtualId }: GerenciamentoAcessosProps) => {
  const [filtro, setFiltro] = useState<FiltroAcesso>("todos");
  const [busca, setBusca] = useState("");
  const [confirmacao, setConfirmacao] = useState<{ usuario: Usuario; acao: AcaoAcesso } | null>(null);
  const [edicaoCargo, setEdicaoCargo] = useState<{ usuario: Usuario; cargoId: number | null } | null>(null);
  const { data: usuarios = [], isLoading, isError, error } = useAcessosUsuarios();
  const { data: cargos = [] } = useCargos();
  const revogar = useRevogarAcesso();
  const reativar = useReativarAcesso();
  const alterarCargo = useAlterarCargoUsuario();
  const processando = revogar.isPending || reativar.isPending;

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((usuario) => {
      const correspondeStatus = filtro === "todos" || usuario.situacao === filtro;
      const correspondeBusca = !termo || [usuario.nomeCompleto, usuario.email, usuario.cargo]
        .some((valor) => valor?.toLowerCase().includes(termo));
      return correspondeStatus && correspondeBusca;
    });
  }, [busca, filtro, usuarios]);

  const ativos = usuarios.filter((usuario) => usuario.situacao === "ATIVO").length;
  const revogados = usuarios.filter((usuario) => usuario.situacao === "REVOGADO").length;

  const confirmar = async () => {
    if (!confirmacao) return;
    const { usuario, acao } = confirmacao;
    try {
      if (acao === "revogar") await revogar.mutateAsync(usuario.id);
      else await reativar.mutateAsync(usuario.id);
      setConfirmacao(null);
      toast({
        title: acao === "revogar" ? "Acesso revogado" : "Acesso reativado",
        description: acao === "revogar"
          ? `${usuario.nomeCompleto} perdeu o acesso à plataforma.`
          : `${usuario.nomeCompleto} recuperou o acesso com as mesmas permissões.`,
      });
    } catch (err) {
      toast({ title: "Erro ao atualizar acesso", description: mensagemErro(err), variant: "destructive" });
    }
  };

  const abrirEdicaoCargo = (usuario: Usuario) => {
    const cargoAtual = cargos.find((cargo) => cargo.nome === usuario.cargo);
    setEdicaoCargo({ usuario, cargoId: cargoAtual?.id || null });
  };

  const salvarCargo = async () => {
    if (!edicaoCargo?.cargoId) return;
    try {
      await alterarCargo.mutateAsync({ id: edicaoCargo.usuario.id, cargoId: edicaoCargo.cargoId });
      toast({ title: "Cargo atualizado", description: `O cargo de ${edicaoCargo.usuario.nomeCompleto} foi atualizado.` });
      setEdicaoCargo(null);
    } catch (err) {
      toast({ title: "Erro ao atualizar cargo", description: mensagemErro(err), variant: "destructive" });
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-6 pb-4">
        {[
          { label: "Usuários ativos", value: ativos, icon: ShieldCheck, color: "text-emerald-500" },
          { label: "Acessos revogados", value: revogados, icon: Ban, color: "text-red-500" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border/25 bg-card/40 p-4">
            <item.icon className={`h-5 w-5 ${item.color}`} />
            <div><p className="text-[22px] font-bold leading-none">{item.value}</p><p className="mt-1 text-[11px] text-muted-foreground/50">{item.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 px-6 pb-4">
        {([['todos', 'Todos'], ['ATIVO', 'Ativos'], ['REVOGADO', 'Revogados']] as [FiltroAcesso, string][]).map(([valor, label]) => (
          <button key={valor} onClick={() => setFiltro(valor)} className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium ${filtro === valor ? "border-accent/25 bg-accent/15 text-accent" : "border-transparent text-muted-foreground/50 hover:bg-muted/20"}`}>{label}</button>
        ))}
        <div className="ml-auto flex h-9 w-[300px] items-center gap-2 rounded-lg border border-border/25 bg-card/30 px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground/50" />
          <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar usuário, e-mail ou cargo..." className="flex-1 bg-transparent text-[12px] outline-none" />
        </div>
      </div>

      <div className="px-6 pb-6">
        {isError && <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-[12px] text-red-500">{mensagemErro(error)}</div>}
        <div className="overflow-hidden rounded-xl border border-border/25 bg-card/40">
          <table className="w-full min-w-[760px]">
            <thead><tr className="border-b border-border/15"><th className="px-5 py-3 text-left text-[10px] uppercase text-muted-foreground/50">Usuário</th><th className="px-4 py-3 text-left text-[10px] uppercase text-muted-foreground/50">Cargo</th><th className="px-4 py-3 text-left text-[10px] uppercase text-muted-foreground/50">Status</th><th className="px-5 py-3 text-right text-[10px] uppercase text-muted-foreground/50">Ações</th></tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={4} className="py-14 text-center text-[12px] text-muted-foreground/40">Carregando acessos...</td></tr>
                : filtrados.length === 0 ? <tr><td colSpan={4} className="py-14 text-center text-[12px] text-muted-foreground/40"><User className="mx-auto mb-2 h-7 w-7 opacity-30" />Nenhum usuário encontrado</td></tr>
                : filtrados.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-border/10 hover:bg-muted/10">
                    <td className="px-5 py-3"><p className="text-[12px] font-medium">{usuario.nomeCompleto}</p><p className="text-[10px] text-muted-foreground/45">{usuario.email}</p></td>
                    <td className="px-4 py-3 text-[11px] text-foreground/70">{usuario.cargo}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${usuario.situacao === "ATIVO" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-500" : "border-red-400/20 bg-red-400/10 text-red-500"}`}>{usuario.situacao === "ATIVO" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Ban className="h-2.5 w-2.5" />}{usuario.situacao === "ATIVO" ? "Ativo" : "Revogado"}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => abrirEdicaoCargo(usuario)} className="inline-flex items-center gap-1 rounded-lg border border-border/30 bg-muted/15 px-2.5 py-1.5 text-[11px] font-medium text-foreground/70 hover:bg-muted/30"><Pencil className="h-3 w-3" />Cargo</button>
                        {usuario.id === usuarioAtualId ? <span className="text-[10px] italic text-muted-foreground/40">Sessão atual</span>
                          : usuario.situacao === "ATIVO" ? <button onClick={() => setConfirmacao({ usuario, acao: "revogar" })} className="inline-flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-400/10 px-2.5 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-400/20"><Ban className="h-3 w-3" />Revogar</button>
                          : <button onClick={() => setConfirmacao({ usuario, acao: "reativar" })} className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 text-[11px] font-medium text-emerald-500 hover:bg-emerald-400/20"><RotateCcw className="h-3 w-3" />Reativar</button>}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={Boolean(confirmacao)} onOpenChange={(aberto) => !aberto && !processando && setConfirmacao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{confirmacao?.acao === "revogar" ? "Revogar acesso" : "Reativar acesso"}</AlertDialogTitle><AlertDialogDescription>{confirmacao?.acao === "revogar" ? `${confirmacao.usuario.nomeCompleto} perderá o acesso imediatamente. O cargo e as permissões serão preservados.` : `${confirmacao?.usuario.nomeCompleto} voltará a acessar a plataforma com o mesmo cargo e as mesmas permissões.`}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={processando} onClick={(event) => { event.preventDefault(); void confirmar(); }} className={confirmacao?.acao === "revogar" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"}>{processando ? "Processando..." : confirmacao?.acao === "revogar" ? "Revogar acesso" : "Reativar acesso"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(edicaoCargo)} onOpenChange={(aberto) => !aberto && !alterarCargo.isPending && setEdicaoCargo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar cargo</AlertDialogTitle>
            <AlertDialogDescription>Selecione o novo cargo de {edicaoCargo?.usuario.nomeCompleto}. As permissões atuais não serão modificadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <select value={edicaoCargo?.cargoId || ""} onChange={(event) => setEdicaoCargo((atual) => atual ? { ...atual, cargoId: Number(event.target.value) } : null)} className="h-10 w-full rounded-lg border border-border/30 bg-background px-3 text-[12px] outline-none focus:border-accent/50">
            <option value="">Selecione o cargo</option>
            {cargos.map((cargo) => <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>)}
          </select>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={alterarCargo.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={alterarCargo.isPending || !edicaoCargo?.cargoId} onClick={(event) => { event.preventDefault(); void salvarCargo(); }}> {alterarCargo.isPending ? "Salvando..." : "Salvar cargo"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
