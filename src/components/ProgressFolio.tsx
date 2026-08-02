import {
  formatFolioCounts,
  formatMissingLabel,
} from "@/lib/formatCollectionProgress";

interface ProgressFolioProps {
  owned: number;
  total: number | undefined;
  isLoading?: boolean;
  className?: string;
}

export function ProgressFolio({
  owned,
  total,
  isLoading = false,
  className = "",
}: ProgressFolioProps) {
  if (isLoading || total == null) {
    return (
      <p className={`text-sm text-[var(--color-text-muted)] ${className}`}>
        Carregando…
      </p>
    );
  }

  const pct =
    total > 0 ? Math.min(100, Math.round((owned / total) * 100)) : 0;
  const missing = formatMissingLabel(owned, total);
  const counts = formatFolioCounts(owned, total);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-text)]">
            {counts}
          </span>
          {missing ? (
            <span className="text-[var(--color-text-muted)]">
              {" "}
              · {missing}
            </span>
          ) : null}
        </p>
        <span className="shrink-0 rounded-full bg-[var(--color-accent)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-on-accent)] shadow-[0_0_16px_-2px_color-mix(in_srgb,var(--color-accent)_70%,transparent)]">
          {pct}%
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)] ring-1 ring-[var(--color-border)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso da coleção: ${pct}%`}
      >
        <div
          className="ui-progress-fill h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}
