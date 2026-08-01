interface CardItemProps {
  id: string;
  name: string;
  localId: string;
  image: string | null;
  rarity?: string;
  isInCollection?: boolean;
  binderMode?: boolean;
  compact?: boolean;
  onPress: (id: string) => void;
}

function resolveImageUrl(image: string | null): string | null {
  if (!image) return null;
  const lower = image.toLowerCase();
  if (lower.endsWith("/high.webp") || lower.endsWith("/high.png")) {
    return image;
  }
  return `${image}/high.webp`;
}

export function CardItem({
  id,
  name,
  localId,
  image,
  rarity,
  isInCollection = false,
  binderMode = false,
  compact = false,
  onPress,
}: CardItemProps) {
  const imageUrl = resolveImageUrl(image);
  const missing = binderMode && !isInCollection;

  const frameClass = binderMode
    ? "ring-1 ring-[var(--color-border)]"
    : isInCollection
      ? "ring-2 ring-[var(--color-success)]"
      : "ring-1 ring-[var(--color-border)]";

  return (
    <button
      type="button"
      onClick={() => onPress(id)}
      className={`group w-full text-left transition hover:-translate-y-0.5 hover:opacity-95 ${compact ? "" : "space-y-2"}`}
    >
      <div
        className={`relative overflow-hidden rounded-sm bg-[var(--color-bg-card)] ${frameClass} ${
          compact ? "aspect-[0.715]" : "aspect-[0.72]"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={missing ? `${name} (não possuída)` : name}
            className={`h-full w-full ${compact ? "object-cover" : "object-contain p-1"} ${
              missing ? "opacity-40 grayscale" : ""
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-muted)]">
            Sem imagem
          </div>
        )}
      </div>
      {!compact && (
        <div className="px-0.5">
          <p
            className={`line-clamp-2 text-sm font-medium ${
              missing
                ? "text-[var(--color-text-muted)]"
                : "text-[var(--color-text)]"
            }`}
          >
            {name}
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-muted)]">
            #{localId}
            {rarity ? ` · ${rarity}` : ""}
          </p>
        </div>
      )}
    </button>
  );
}
