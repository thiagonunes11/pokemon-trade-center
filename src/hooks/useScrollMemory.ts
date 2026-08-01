import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const PREFIX = "ptc:scroll:";

/**
 * Salva o scroll da janela ao sair da rota e restaura no botão/voltar do histórico (POP).
 * Passe `ready` quando o conteúdo longo só existe após loading (ex.: grid do set).
 */
export function useScrollMemory(ready = true) {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const key = `${PREFIX}${pathname}`;
  const shouldRestore = navigationType === "POP";

  useLayoutEffect(() => {
    if (!ready) return;

    if (shouldRestore) {
      const raw = sessionStorage.getItem(key);
      const y = raw != null ? Number(raw) : NaN;
      if (!Number.isNaN(y) && y > 0) {
        window.scrollTo(0, y);
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }

    return () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };
  }, [key, shouldRestore, ready]);
}
