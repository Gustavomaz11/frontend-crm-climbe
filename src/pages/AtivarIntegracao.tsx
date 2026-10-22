import { useEffect, useRef, useState } from "react";
import { Copy, KeyRound, Loader2 } from "lucide-react";
import { ativarIntegracao, erroIntegracao } from "@/services/useIntegracoes";

export default function AtivarIntegracao() {
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
  const [credenciais, setCredenciais] = useState<{ client_id: string; client_secret: string } | null>(null);
  const [carregando, setCarregando] = useState(false); const [erro, setErro] = useState(""); const [copiado, setCopiado] = useState("");
  const bloqueio = useRef(false);
  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    const meta = document.createElement("meta"); meta.name = "referrer"; meta.content = "no-referrer"; document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  const ativar = async () => {
    if (bloqueio.current || !token) return; bloqueio.current = true; setCarregando(true); setErro("");
    try { setCredenciais(await ativarIntegracao(token)); setToken(""); }
    catch (e) { setErro(erroIntegracao(e)); } finally { setCarregando(false); bloqueio.current = false; }
  };
  const copiar = async (campo: "client_id" | "client_secret") => {
    try { await navigator.clipboard.writeText(credenciais?.[campo] ?? ""); setCopiado(`${campo.toUpperCase()} copiado.`); }
    catch { setCopiado("Selecione o valor e copie manualmente."); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-background p-5 text-foreground"><section className="w-full max-w-xl rounded-2xl border border-border/40 bg-card p-7 shadow-lg">
    <p className="mb-7 text-xs font-bold tracking-[0.2em] text-primary">CLIMBE</p><KeyRound className="mb-4 text-primary" size={32} /><h1 className="text-2xl font-bold">{credenciais ? "Integração ativada" : "Ative sua integração"}</h1>
    {credenciais ? <><p className="my-4 text-sm text-muted-foreground">Guarde as credenciais no servidor da sua plataforma. O CLIENT_SECRET é exibido uma única vez e não poderá ser consultado novamente ao sair desta página.</p>
      {(["client_id", "client_secret"] as const).map(campo => <div className="mt-4" key={campo}><label htmlFor={campo} className="text-xs font-semibold">{campo.toUpperCase()}</label><div className="mt-2 flex gap-2"><input id={campo} readOnly value={credenciais[campo]} autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3 font-mono text-xs" /><button onClick={() => copiar(campo)} aria-label={`Copiar ${campo.toUpperCase()}`} className="rounded-lg border border-border p-3"><Copy size={16} /></button></div></div>)}
      {copiado && <p role="status" className="mt-3 text-xs text-primary">{copiado}</p>}<p className="mt-5 text-xs text-muted-foreground">Use o PDF enviado por e-mail para obter o access_token e consultar os endpoints autorizados. Se perder o segredo, solicite sua rotação ao administrador.</p></>
    : <><p className="my-4 text-sm text-muted-foreground">Ao ativar, você receberá o CLIENT_ID e o CLIENT_SECRET para conectar sua plataforma. Prepare um local seguro para guardar o segredo.</p>
      {token ? <button onClick={ativar} disabled={carregando} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{carregando && <Loader2 className="animate-spin" size={16} />}{carregando ? "Ativando…" : "Ativar e mostrar credenciais"}</button> : <p role="alert" className="rounded-lg bg-muted p-4 text-sm">Abra o link recebido por e-mail. Se já o utilizou ou ele expirou, solicite novas credenciais ao administrador.</p>}
      {erro && <p role="alert" className="mt-4 text-sm text-destructive">{erro}</p>}</>}
  </section></main>;
}
