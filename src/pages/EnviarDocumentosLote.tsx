import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, FileCheck, UploadCloud } from "lucide-react";
import ClimbLogo from "@/components/login/ClimbLogo";
import {
  enviarDocumentoLotePorToken,
  getDocumentoLoteUploadInfo,
  type DocumentoLote,
} from "@/services";

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

const EnviarDocumentosLote = () => {
  const { token = "" } = useParams();
  const [lote, setLote] = useState<DocumentoLote | null>(null);
  const [files, setFiles] = useState<Record<number, File>>({});
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getDocumentoLoteUploadInfo(token)
      .then((data) => active && setLote(data))
      .catch((err) => active && setError(err instanceof Error ? err.message : "Link inválido ou expirado."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  async function handleSubmit() {
    const pendentes = lote?.documentos.filter((item) => item.validado === "PENDENTE" && files[item.id]) ?? [];
    if (pendentes.length === 0) {
      setError("Selecione ao menos um arquivo pendente.");
      return;
    }
    try {
      setSending(true);
      setError("");
      const enviados = await Promise.all(
        pendentes.map((item) => enviarDocumentoLotePorToken(token, item.id, files[item.id])),
      );
      setLote((current) => current && ({
        ...current,
        documentos: current.documentos.map((item) => enviados.find((enviado) => enviado.id === item.id) ?? item),
      }));
      setFiles({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar os documentos.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <main className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border/30 bg-card/90 shadow-2xl">
        <header className="border-b border-border/20 p-6">
          <ClimbLogo className="mb-5 h-[18px] text-foreground" />
          <h1 className="text-xl font-semibold">Envio de documentos</h1>
          <p className="mt-1 text-xs text-muted-foreground">Anexe os documentos solicitados pela equipe Climbe no mesmo formulário.</p>
        </header>
        <section className="space-y-4 p-6">
          {loading && <p className="py-10 text-center text-xs text-muted-foreground">Carregando solicitação...</p>}
          {!loading && error && !lote && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-center text-sm text-destructive">
              <AlertCircle className="mx-auto mb-2 h-7 w-7" />{error}
            </div>
          )}
          {lote && (
            <>
              <div className="rounded-xl border border-border/20 bg-background/45 p-4 text-sm">
                <strong>{lote.nomeEmpresa}</strong>
                <span className="ml-2 text-muted-foreground">· {lote.documentos.length} documento(s) solicitado(s)</span>
              </div>
              <div className="space-y-3">
                {lote.documentos.map((documento) => {
                  const enviado = documento.validado !== "PENDENTE";
                  return (
                    <label key={documento.id} className={`block rounded-xl border p-4 ${enviado ? "border-accent/20 bg-accent/5" : "border-border/25 bg-background/35"}`}>
                      <div className="flex items-center gap-3">
                        {enviado ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <UploadCloud className="h-5 w-5 text-muted-foreground" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{documento.titulo}</p>
                          <p className="text-[11px] text-muted-foreground">{enviado ? "Arquivo recebido" : files[documento.id]?.name || "Selecione o arquivo"}</p>
                        </div>
                        {!enviado && (
                          <span className="rounded-lg border border-border/30 px-3 py-2 text-xs">Escolher</span>
                        )}
                      </div>
                      {!enviado && (
                        <input
                          type="file"
                          accept={ACCEPTED}
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) setFiles((current) => ({ ...current, [documento.id]: file }));
                          }}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <button onClick={handleSubmit} disabled={sending || Object.keys(files).length === 0} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-xs font-semibold text-accent-foreground disabled:opacity-50">
                <FileCheck className="h-4 w-4" />{sending ? "Enviando..." : "Enviar documentos selecionados"}
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default EnviarDocumentosLote;
