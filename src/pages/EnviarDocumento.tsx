import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, FileCheck, UploadCloud, X } from "lucide-react";
import ClimbLogo from "@/components/login/ClimbLogo";
import {
  enviarDocumentoPorToken,
  getDocumentoUploadInfo,
  type DocumentoUploadInfo,
} from "@/services";

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

const EnviarDocumento = () => {
  const { token = "" } = useParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [info, setInfo] = useState<DocumentoUploadInfo | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getDocumentoUploadInfo(token);
        if (active) {
          setInfo(data);
          setError("");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Link de envio inválido ou expirado.";
        if (active) setError(message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [token]);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) {
      setFile(nextFile);
      setError("");
    }
  }

  async function handleSubmit() {
    if (!file) {
      setError("Selecione o arquivo solicitado antes de enviar.");
      return;
    }

    try {
      setSending(true);
      setError("");
      await enviarDocumentoPorToken(token, file);
      setSuccess(true);
      setFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar documento.";
      setError(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 45% at 0% 0%, hsl(var(--accent) / 0.08) 0%, transparent 55%), radial-gradient(ellipse 50% 45% at 100% 100%, hsl(var(--primary) / 0.06) 0%, transparent 50%)` }} />
      </div>

      <motion.main className="relative z-10 w-full max-w-xl rounded-2xl border border-border/30 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-6 border-b border-border/20">
          <ClimbLogo className="h-[18px] text-foreground mb-5" />
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold text-foreground tracking-tight">Envio de documento</h1>
              <p className="text-[12px] text-muted-foreground/55 mt-1">Anexe o arquivo solicitado pela equipe Climbe.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-10 text-center text-[12px] text-muted-foreground/50">Carregando solicitação...</div>
          ) : success ? (
            <div className="rounded-xl border border-accent/20 bg-accent/10 p-5 text-center">
              <CheckCircle2 className="w-9 h-9 text-accent mx-auto mb-3" />
              <h2 className="text-[15px] font-semibold text-foreground">Documento enviado</h2>
              <p className="text-[12px] text-muted-foreground/55 mt-1">O arquivo foi recebido e seguirá para análise.</p>
            </div>
          ) : error && !info ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-center">
              <AlertCircle className="w-9 h-9 text-destructive mx-auto mb-3" />
              <h2 className="text-[15px] font-semibold text-foreground">Não foi possível abrir o link</h2>
              <p className="text-[12px] text-destructive mt-1">{error}</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border/20 bg-background/45 p-4 space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Documento solicitado</p>
                  <p className="text-[14px] font-semibold text-foreground mt-1">{info?.titulo}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Empresa</p>
                    <p className="text-[12px] text-foreground/75 mt-1 truncate">{info?.nomeEmpresa || `Empresa #${info?.empresaId}`}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Expira em</p>
                    <p className="text-[12px] text-foreground/75 mt-1">{formatDate(info?.tokenExpiraEm)}</p>
                  </div>
                </div>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0];
                  if (nextFile) {
                    setFile(nextFile);
                    setError("");
                  }
                }}
              />

              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${dragOver ? "border-accent/60 bg-accent/5" : "border-border/30 hover:border-accent/40 hover:bg-muted/10"}`}
              >
                <UploadCloud className={`w-8 h-8 mx-auto mb-3 ${dragOver ? "text-accent" : "text-muted-foreground/45"}`} />
                <p className="text-[13px] font-medium text-foreground/80">{dragOver ? "Solte o arquivo aqui" : "Clique para selecionar ou arraste o arquivo"}</p>
                <p className="text-[11px] text-muted-foreground/45 mt-1">PDF, DOC, DOCX, XLS, XLSX ou imagem</p>
              </div>

              {file && (
                <div className="flex items-center gap-3 rounded-lg border border-border/20 bg-background/45 px-3 py-2">
                  <FileCheck className="w-4 h-4 text-accent shrink-0" />
                  <span className="flex-1 min-w-0 text-[12px] text-foreground/80 truncate">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground/45 shrink-0">{formatBytes(file.size)}</span>
                  <button onClick={() => setFile(null)} className="w-6 h-6 rounded hover:bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {error && <p className="text-[12px] text-destructive">{error}</p>}

              <button onClick={handleSubmit} disabled={sending || !file} className="w-full h-10 rounded-lg bg-accent text-accent-foreground text-[12px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                {sending ? "Enviando..." : "Enviar documento"}
              </button>
            </>
          )}
        </div>
      </motion.main>
    </div>
  );
};

export default EnviarDocumento;
