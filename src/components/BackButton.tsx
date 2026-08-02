import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface BackButtonProps {
  /** Destino se a página foi aberta sem histórico interno (ex.: link direto). */
  to: string;
  children: ReactNode;
}

/** Controle Voltar com ≥44px de toque; prefere histórico para preservar scroll. */
export function BackButton({ to, children }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <button
      type="button"
      onClick={() => {
        if (location.key !== "default") {
          navigate(-1);
        } else {
          navigate(to);
        }
      }}
      className="inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      <svg className="h-4 w-4 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m15 18-6-6 6-6" />
      </svg>
      {children}
    </button>
  );
}
