import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`ui-empty ${className}`}>
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-accent)] shadow-[0_12px_30px_-18px_var(--color-accent)]">
          {icon}
        </div>
      ) : null}
      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-text)]">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
