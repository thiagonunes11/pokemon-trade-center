import {
  getCollectionAvailability,
  type CollectionConfig,
} from "@/lib/collections";
import { ProgressFolio } from "@/components/ProgressFolio";

interface CollectionPickerCardProps {
  collection: CollectionConfig;
  owned: number;
  total: number | undefined;
  isLoading: boolean;
  onSelect: (setId: string) => void;
}

export function CollectionPickerCard({
  collection,
  owned,
  total,
  isLoading,
  onSelect,
}: CollectionPickerCardProps) {
  const availability = getCollectionAvailability(total, isLoading);
  const openable = availability === "available";

  return (
    <button
      type="button"
      disabled={!openable}
      onClick={() => openable && onSelect(collection.id)}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border text-left ${
        openable
          ? "ui-card-lift ui-sheen ui-spotlight ui-glass border-[var(--color-border)]"
          : "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-bg-card)] opacity-55"
      }`}
      onMouseMove={
        openable
          ? (e) => {
              const el = e.currentTarget;
              const r = el.getBoundingClientRect();
              el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
              el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
            }
          : undefined
      }
    >
      <div className="relative flex aspect-[16/10] items-center justify-center bg-[var(--color-bg-elevated)] px-6 py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 transition duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(ellipse at 50% 35%, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 62%)",
          }}
        />
        <span className="relative z-[1] max-w-[85%] text-center font-[family-name:var(--font-display)] text-2xl font-extrabold text-[var(--color-text)]">
          {collection.name}
        </span>
        {collection.logoUrl ? (
          <img
            src={collection.logoUrl}
            alt={collection.name}
            className="absolute z-[2] max-h-[70%] max-w-[75%] object-contain drop-shadow-md transition duration-300 group-hover:scale-[1.05]"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : collection.symbolUrl ? (
          <img
            src={collection.symbolUrl}
            alt=""
            className="absolute z-[2] max-h-20 max-w-24 object-contain opacity-80 drop-shadow-md"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : null}
        {!openable && !isLoading ? (
          <span className="absolute top-3 right-3 z-[3] rounded-full bg-[var(--color-bg)]/80 px-2.5 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] backdrop-blur">
            Em breve
          </span>
        ) : null}
      </div>

      <div className="relative z-[3] space-y-3 border-t border-[var(--color-border)] p-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--color-text)]">
            {collection.name}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {collection.subtitle}
          </p>
        </div>
        {openable || isLoading ? (
          <ProgressFolio owned={owned} total={total} isLoading={isLoading} />
        ) : (
          <p className="text-xs text-[var(--color-text-muted)]">
            Catálogo indisponível na TCGdex
          </p>
        )}
      </div>
    </button>
  );
}
