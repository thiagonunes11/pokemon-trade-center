type ImageQuality = "low" | "high";

interface CardItemProps {
  id: string;
  name: string;
  localId: string;
  image: string | null;
  rarity?: string;
  /** Grid usa low; detalhe/share usam high. */
  imageQuality?: ImageQuality;
  isInCollection?: boolean;
  binderMode?: boolean;
  /** Modo marcar: carta está na seleção atual. */
  markMode?: boolean;
  isSelected?: boolean;
  compact?: boolean;
  onPress: (id: string) => void;
}

function resolveImageUrl(
  image: string | null,
  quality: ImageQuality,
): string | null {
  if (!image) return null;
  const lower = image.toLowerCase();
  if (
    lower.endsWith("/high.webp") ||
    lower.endsWith("/high.png") ||
    lower.endsWith("/low.webp") ||
    lower.endsWith("/low.png")
  ) {
    return image;
  }
  return `${image}/${quality}.webp`;
}

export function CardItem({
  id,
  name,
  localId,
  image,
  rarity,
  imageQuality = "low",
  isInCollection = false,
  binderMode = false,
  markMode = false,
  isSelected = false,
  compact = false,
  onPress,
}: CardItemProps) {
  const imageUrl = resolveImageUrl(image, imageQuality);
  const missing = binderMode && !isInCollection;

  const frameClass = markMode
    ? isSelected
      ? "ring-2 ring-[var(--color-accent)]"
      : "ring-1 ring-dashed ring-[var(--color-border)]"
    : binderMode
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
        className={`relative overflow-hidden rounded-xl bg-[var(--color-bg-card)] ${frameClass} ${
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
            decoding="async"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-muted)]">
            Sem imagem
          </div>
        )}
        {markMode ? (
          <span
            className={`absolute top-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
              isSelected
                ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                : "bg-black/50 text-white/90"
            }`}
            aria-hidden
          >
            {isSelected ? "✓" : ""}
          </span>
        ) : null}
        <span
          className={`absolute right-1.5 bottom-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
            missing
              ? "bg-black/45 text-white/80"
              : "bg-black/55 text-white"
          }`}
        >
          #{localId}
        </span>
      </div>
      {!compact && (
        <div className="space-y-0.5 px-0.5">
          <p
            className={`line-clamp-2 text-sm font-semibold leading-snug ${
              missing
                ? "text-[var(--color-text-muted)]"
                : "text-[var(--color-text)]"
            }`}
          >
            {name}
          </p>
          {rarity ? (
            <p className="text-xs text-[var(--color-text-muted)]">{rarity}</p>
          ) : null}
        </div>
      )}
    </button>
  );
}
