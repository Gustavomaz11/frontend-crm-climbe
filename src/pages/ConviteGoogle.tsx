import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { beginGoogleLogin } from "@/lib/googleOAuthPkce";
import { Button } from "@/components/ui/button";

export default function ConviteGoogle() {
  const iniciado = useRef(false);
  const [erro, setErro] = useState(false);
  const iniciar = useCallback(async () => {
    setErro(false);
    try {
      const { authorizationUrl } = await beginGoogleLogin();
      window.location.assign(authorizationUrl);
    } catch { setErro(true); }
  }, []);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    void iniciar();
  }, [iniciar]);

  return <main className="flex min-h-screen items-center justify-center bg-background p-6">
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="text-2xl font-semibold">Bem-vindo ao CRM da Climbe!</h1>
      {erro ? <>
        <p role="alert">Não foi possível iniciar o login com Google. Tente novamente.</p>
        <Button onClick={() => void iniciar()}>Continuar com Google</Button>
        <p><Link to="/" className="text-sm text-muted-foreground underline">Voltar para o login</Link></p>
      </> : <p role="status" className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Conectando com o Google...</p>}
    </div>
  </main>;
}
