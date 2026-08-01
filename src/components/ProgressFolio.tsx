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
      <p
        className={`font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-muted)] ${className}`}
      >
        Carregando…
      </p>
    );
  }

  const pct =
    total > 0 ? Math.min(100, Math.round((owned / total) * 100)) : 0;
  const missing = formatMissingLabel(owned, total);
  const counts = formatFolioCounts(owned, total);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <p className="font-[family-name:var(--font-mono)] text-xs tracking-wide text-[var(--color-text-secondary)]">
        <span className="text-[var(--color-text)]">{counts}</span>
        {missing ? (
          <>
            <span className="mx-1.5 text-[var(--color-text-muted)]">·</span>
            <span>{missing}</span>
          </>
        ) : null}
      </p>
      <div
        className="h-0.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso da coleção: ${pct}%`}
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
