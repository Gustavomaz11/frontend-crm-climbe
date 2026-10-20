import { useEffect, useState } from "react";

const podeExibir = () => !document.hidden && !Array.from(document.querySelectorAll(
  'dialog[open], [role="dialog"], [role="alertdialog"]',
)).some(element => !element.hasAttribute("data-notificacao-popup")
  && !element.hasAttribute("hidden") && element.getAttribute("data-state") !== "closed");

/** Aguarda o usuário terminar o diálogo atual antes de apresentar outro aviso. */
export const useNotificacaoPopupDisponivel = () => {
  const [disponivel, setDisponivel] = useState(podeExibir);
  useEffect(() => {
    const atualizar = () => setDisponivel(podeExibir());
    const observer = new MutationObserver(atualizar);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "hidden", "data-state"] });
    document.addEventListener("visibilitychange", atualizar);
    atualizar();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", atualizar); };
  }, []);
  return disponivel;
};
