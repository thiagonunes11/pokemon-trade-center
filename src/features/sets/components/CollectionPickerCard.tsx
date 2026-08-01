import {
  getCollectionAvailability,
  type CollectionConfig,
} from "@/lib/collections";
import { formatCollectionProgress } from "@/lib/formatCollectionProgress";

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
  const progress =
    total != null && total > 0
      ? formatCollectionProgress(owned, total)
      : isLoading
        ? "Carregando…"
        : (collection.unavailableMessage ?? "Catálogo em breve");

  return (
    <button
      type="button"
      disabled={!openable}
      onClick={() => openable && onSelect(collection.id)}
      className={`flex w-full items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-left transition ${
        openable
          ? "hover:border-[var(--color-accent)] hover:shadow-sm"
          : "cursor-not-allowed opacity-55"
      }`}
    >
      <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-elevated)] p-2">
        <img
          src={collection.logoUrl}
          alt={collection.name}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold text-[var(--color-text)]">
          {collection.name}
        </h2>
        <p className="truncate text-sm text-[var(--color-text-secondary)]">
          {collection.subtitle}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{progress}</p>
      </div>
    </button>
  );
}
