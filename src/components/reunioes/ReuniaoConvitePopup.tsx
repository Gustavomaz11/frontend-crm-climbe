import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { parseCookies } from "nookies";
import { X } from "lucide-react";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/authCookies";
import { useAuthStore } from "@/store/useAuthStore";
import { useConvitesReuniaoPendentes, type Reuniao } from "@/services/useReunioes";
import { reuniaoHorario } from "./reuniaoPresentation";
import { AceitarReuniaoButton } from "./AceitarReuniaoButton";

const conviteKey = (reuniao: Reuniao) => String(reuniao.conviteId ?? reuniao.id);
const lerVistos = (key: string): string[] => {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
};

const ConviteDialog = ({ convite, onDismiss }: { convite: Reuniao; onDismiss: () => void }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const navigate = useNavigate();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  const data = convite.data ?? convite.dataHora.slice(0, 10);
  return createPortal(<dialog ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onDismiss(); }}
    className="app-dialog m-auto w-[calc(100%_-_24px)] max-w-lg rounded-2xl border border-border/40 bg-card p-5 text-foreground shadow-2xl backdrop:bg-background/80 backdrop:backdrop-blur-md">
    <header className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-semibold text-accent">Novo convite para reunião</p><h2 id={titleId} className="mt-2 break-words text-lg font-semibold">{convite.titulo}</h2></div>
      <button type="button" aria-label="Fechar convite" onClick={onDismiss} className="app-icon-button"><X className="h-4 w-4" /></button>
    </header>
    <p className="mt-4 text-sm">Você foi convidado para esta reunião.</p>
    <p className="mt-2 text-sm font-medium">{new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR")} · {reuniaoHorario(convite)}</p>
    <p className="mt-2 break-words text-sm text-muted-foreground">{convite.local || "Reunião virtual"}</p>
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <AceitarReuniaoButton reuniao={convite} onAccepted={onDismiss} />
      <button type="button" onClick={() => { onDismiss(); navigate(`/agenda?reuniaoId=${convite.id}`); }} className="rounded-lg border border-border/40 px-4 py-2.5 text-xs font-medium">Ver detalhes</button>
      <button type="button" onClick={onDismiss} className="px-2 py-2 text-xs text-muted-foreground">Agora não</button>
    </div>
  </dialog>, document.body);
};

const ConvitesDoUsuario = ({ usuarioId }: { usuarioId: number }) => {
  const storageKey = `climb:convites-vistos:${usuarioId}`;
  const [vistos, setVistos] = useState(() => lerVistos(storageKey));
  const { data: convites = [] } = useConvitesReuniaoPendentes(usuarioId);
  const convite = convites.find(item => !vistos.includes(conviteKey(item)));
  if (!convite) return null;
  const dismiss = () => {
    setVistos(atuais => {
      const next = [...new Set([...atuais, conviteKey(convite)])].slice(-500);
      try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* A sessão continua deduplicando em memória. */ }
      return next;
    });
  };
  return <ConviteDialog key={conviteKey(convite)} convite={convite} onDismiss={dismiss} />;
};

export const ReuniaoConvitePopup = () => {
  const usuarioId = useAuthStore(state => state.basicUserData?.id ?? state.userData?.id);
  const cookies = parseCookies();
  if (!usuarioId || !cookies[ACCESS_TOKEN_COOKIE] && !cookies[REFRESH_TOKEN_COOKIE]) return null;
  return <ConvitesDoUsuario key={usuarioId} usuarioId={usuarioId} />;
};
