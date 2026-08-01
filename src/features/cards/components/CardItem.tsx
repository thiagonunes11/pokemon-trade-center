interface CardItemProps {
  id: string;
  name: string;
  localId: string;
  image: string | null;
  rarity?: string;
  isInCollection?: boolean;
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
  compact = false,
  onPress,
}: CardItemProps) {
  const imageUrl = resolveImageUrl(image);

  return (
    <button
      type="button"
      onClick={() => onPress(id)}
      className={`group w-full text-left transition hover:opacity-95 ${compact ? "" : "space-y-2"}`}
    >
      <div
        className={`relative overflow-hidden rounded-lg bg-[var(--color-bg-card)] ${
          isInCollection ? "ring-2 ring-[var(--color-success)]" : "ring-1 ring-[var(--color-border)]"
        } ${compact ? "aspect-[0.715]" : "aspect-[0.72]"}`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className={`h-full w-full ${compact ? "object-cover" : "object-contain p-1"}`}
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
          <p className="line-clamp-2 text-sm font-medium text-[var(--color-text)]">
            {name}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            #{localId}
            {rarity ? ` · ${rarity}` : ""}
          </p>
        </div>
      )}
    </button>
  );
}
