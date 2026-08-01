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
      className={`flex w-full items-center gap-4 border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-left transition ${
        openable
          ? "hover:border-[var(--color-accent)] hover:shadow-sm"
          : "cursor-not-allowed opacity-55"
      }`}
    >
      <div className="flex h-16 w-28 shrink-0 items-center justify-center bg-[var(--color-bg-elevated)] p-2">
        <img
          src={collection.logoUrl}
          alt={collection.name}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <h2 className="truncate font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text)]">
            {collection.name}
          </h2>
          <p className="truncate font-[family-name:var(--font-serif)] text-sm text-[var(--color-text-secondary)]">
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
