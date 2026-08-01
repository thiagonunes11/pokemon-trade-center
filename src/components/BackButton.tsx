import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface BackButtonProps {
  to: string;
  children: ReactNode;
}

/** Ghost back control with ≥44px touch target for mobile. */
export function BackButton({ to, children }: BackButtonProps) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      <span aria-hidden className="text-[var(--color-accent)]">
        ←
      </span>
      {children}
    </Link>
  );
}
