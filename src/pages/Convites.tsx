import { useState, type FormEvent } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { AppPageShell } from "@/components/layout/AppPageShell";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useUsuarioPermissoes } from "@/services/usePermissoes";
import { analisarDestinatarios, mensagemConvite, useEnviarConvites } from "@/services/useConvites";

export default function Convites() {
  const usuarioId = useAuthStore(state => state.basicUserData?.id ?? state.userData?.id);
  const permissoes = useUsuarioPermissoes(usuarioId);
  const autorizado = permissoes.data?.some(item => item.permissao.codigo === "PERMITIR_ACESSO") ?? false;
  const envio = useEnviarConvites();
  const [texto, setTexto] = useState("");
  const [agendados, setAgendados] = useState<number | null>(null);
  const { emails, invalidos, duplicados } = analisarDestinatarios(texto);
  const podeEnviar = emails.length > 0 && emails.length <= 100 && invalidos.length === 0;

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    if (!autorizado || !podeEnviar || envio.isPending) return;
    setAgendados(null);
    try {
      const resultado = await envio.mutateAsync(emails);
      setAgendados(resultado.agendados);
      setTexto("");
    } catch { /* A mensagem da API é apresentada no formulário. */ }
  };

  return <AppPageShell><div className="space-y-6 p-6 lg:p-8">
    <div><h1 className="text-2xl font-semibold">Convite</h1><p className="mt-1 text-muted-foreground">Dê as boas-vindas aos sócios no CRM da Climbe.</p></div>
    {permissoes.isLoading ? <p role="status">Carregando permissões...</p> : !autorizado ?
      <p role="alert">Você não tem permissão para enviar convites.</p> :
      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={enviar} className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Convidar pessoas</h2></div>
          <div className="space-y-2">
            <label htmlFor="emails-convite" className="text-sm font-medium">E-mails dos destinatários</label>
            <textarea id="emails-convite" value={texto} disabled={envio.isPending} rows={9}
              onChange={event => { setTexto(event.target.value); envio.reset(); setAgendados(null); }}
              placeholder={"socio@empresa.com.br\noutra.pessoa@empresa.com.br"}
              aria-describedby="emails-ajuda emails-validacao"
              className="w-full rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" />
            <p id="emails-ajuda" className="text-sm text-muted-foreground">Separe por linha, vírgula ou ponto e vírgula. Até 100 destinatários por lote.</p>
            <div id="emails-validacao" aria-live="polite" className="text-sm">
              <p>{emails.length} destinatário(s){duplicados > 0 && ` · ${duplicados} repetido(s) ignorado(s)`}</p>
              {invalidos.length > 0 && <p className="mt-2 break-words text-destructive">Corrija os e-mails: {invalidos.join(", ")}</p>}
              {emails.length > 100 && <p className="mt-2 text-destructive">Divida a lista em lotes de até 100 destinatários.</p>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Cada pessoa receberá um convite individual. O acesso será liberado após autenticação com Google e aprovação do cadastro.</p>
          <Button type="submit" disabled={!podeEnviar || envio.isPending}>
            {envio.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {envio.isPending ? "Agendando convites..." : "Enviar convites"}
          </Button>
          {agendados !== null && <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{agendados} convite(s) adicionado(s) à fila de envio. Os e-mails serão enviados em segundo plano.</p>}
          {envio.isError && <p role="alert" className="text-sm text-destructive">{envio.error.message}</p>}
        </form>
        <section aria-label="Prévia do convite" className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div><p className="text-sm text-muted-foreground">Prévia do e-mail</p><h2 className="mt-1 text-lg font-semibold">Bem-vindo ao CRM da Climbe!</h2></div>
          <p className="whitespace-pre-line text-sm leading-7">{mensagemConvite}</p>
          <span className="inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Abrir no Climbe</span>
          <p className="text-xs text-muted-foreground">O botão inicia a autenticação com Google.</p>
        </section>
      </div>}
  </div></AppPageShell>;
}
