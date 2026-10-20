import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { parseCookies } from "nookies";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, AUTH_SESSION_CHANGED_EVENT } from "@/lib/authCookies";
import { useAuthStore } from "@/store/useAuthStore";
import { useMinhasNotificacoes } from "@/services/useNotificacoes";
import { useNotificacaoPopupDisponivel } from "@/hooks/useNotificacaoPopupDisponivel";
import { NotificacaoPopupToast } from "./NotificacaoPopupToast";

const sessaoAtiva = () => {
  const cookies = parseCookies();
  return !!(cookies[ACCESS_TOKEN_COOKIE] || cookies[REFRESH_TOKEN_COOKIE]);
};
const observarSessao = (atualizar: () => void) => {
  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, atualizar);
  document.addEventListener("visibilitychange", atualizar);
  return () => {
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, atualizar);
    document.removeEventListener("visibilitychange", atualizar);
  };
};
const lerVistos = (key: string): Set<number> => {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter(item => Number.isSafeInteger(item) && item > 0) : []);
  } catch { return new Set(); }
};

const PopupsDoUsuario = ({ usuarioId }: { usuarioId: number }) => {
  const storageKey = `climb:notificacoes-popups:${usuarioId}`;
  const ativo = useRef(true);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);
  const navigate = useNavigate();
  const [vistos, setVistos] = useState(() => lerVistos(storageKey));
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify([...vistos])); } catch { /* O navegador pode bloquear o armazenamento; o estado permanece em memória. */ }
  }, [storageKey, vistos]);
  const { data: notificacoes = [], isFetchedAfterMount, isError } = useMinhasNotificacoes(usuarioId);
  const disponivel = useNotificacaoPopupDisponivel();
  const notificacao = notificacoes.filter(item => !item.lida && !vistos.has(item.id)).sort((a, b) => a.id - b.id)[0];
  if (!isFetchedAfterMount || isError || !disponivel || !notificacao) return null;
  const dispensar = () => {
    setVistos(anteriores => new Set(anteriores).add(notificacao.id));
  };
  return <NotificacaoPopupToast key={notificacao.id} notificacao={notificacao} onDismiss={dispensar} onRead={destino => {
    if (!ativo.current) return;
    dispensar();
    if (destino) navigate(destino);
  }} />;
};

export const NotificacoesPopup = () => {
  const usuarioId = useAuthStore(state => state.basicUserData?.id ?? state.userData?.id);
  const autenticado = useSyncExternalStore(observarSessao, sessaoAtiva, () => false);
  if (!usuarioId || !autenticado) return null;
  return <PopupsDoUsuario key={usuarioId} usuarioId={usuarioId} />;
};
