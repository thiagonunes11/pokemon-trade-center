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
          ? "ui-card-lift ui-sheen border-[var(--color-border)] bg-[var(--color-bg-card)]"
          : "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-bg-card)] opacity-55"
      }`}
    >
      <div className="relative flex aspect-[16/10] items-center justify-center bg-[var(--color-bg-elevated)] px-6 py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 transition duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(ellipse at 50% 35%, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 62%)",
          }}
        />
        <img
          src={collection.logoUrl}
          alt={collection.name}
          className="relative z-[1] max-h-full max-w-[85%] object-contain drop-shadow-md transition duration-300 group-hover:scale-[1.05]"
          loading="lazy"
        />
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
            {collection.unavailableMessage ?? "Catálogo em breve"}
          </p>
        )}
      </div>
    </button>
  );
}
