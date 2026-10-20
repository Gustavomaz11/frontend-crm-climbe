import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { parseCookies } from "nookies";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, AUTH_SESSION_CHANGED_EVENT } from "@/lib/authCookies";
import { conectarAvisos, type AvisoSinal } from "@/services/avisosStream";

export const useAvisosTempoReal = (usuarioId?: number) => {
  const client = useQueryClient();
  useEffect(() => {
    if (!usuarioId) return;
    let conexao: AbortController | undefined;
    const pendentes = new Set<AvisoSinal>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sincronizar = () => {
      timer = undefined;
      if (!conexao || conexao.signal.aborted) return;
      if (pendentes.has("notificacoes") || pendentes.has("sincronizar")) {
        void client.invalidateQueries({ queryKey: ["notificacoes", usuarioId] });
      }
      if (pendentes.has("convites") || pendentes.has("sincronizar")) {
        void client.invalidateQueries({ queryKey: ["reunioes", "convites", usuarioId] });
        // A reunião precisa estar na agenda atual antes de o convidado abrir os detalhes pelo aviso.
        void client.invalidateQueries({ queryKey: ["reunioes"], exact: true });
      }
      if (pendentes.has("kanban") || pendentes.has("sincronizar")) {
        void client.invalidateQueries({ queryKey: ["contratos", "kanban-resumos", usuarioId] });
        void client.invalidateQueries({ queryKey: ["contratos", "kanban-acesso", usuarioId] });
      }
      pendentes.clear();
    };
    const desconectar = () => {
      conexao?.abort(); conexao = undefined;
      clearTimeout(timer); timer = undefined; pendentes.clear();
    };
    const iniciar = () => {
      desconectar();
      const cookies = parseCookies();
      if (!cookies[ACCESS_TOKEN_COOKIE] && !cookies[REFRESH_TOKEN_COOKIE]) return;
      if (document.hidden || !navigator.onLine) return;
      const atual = new AbortController();
      conexao = atual;
      void conectarAvisos(atual.signal, sinal => {
        if (atual.signal.aborted) return;
        pendentes.add(sinal);
        timer ??= setTimeout(sincronizar, 100);
      }).catch(() => { /* A recusa de autenticação é tratada pelos interceptadores da sessão. */ });
    };
    iniciar();
    document.addEventListener("visibilitychange", iniciar);
    window.addEventListener("online", iniciar);
    window.addEventListener("offline", desconectar);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, iniciar);
    return () => {
      desconectar();
      document.removeEventListener("visibilitychange", iniciar);
      window.removeEventListener("online", iniciar);
      window.removeEventListener("offline", desconectar);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, iniciar);
    };
  }, [client, usuarioId]);
};
