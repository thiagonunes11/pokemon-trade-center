import { useRef } from "react";

type ImageQuality = "low" | "high";

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 12;

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
  /** Segurar a carta (ex.: entrar no modo marcar). */
  onLongPress?: (id: string) => void;
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
  onLongPress,
}: CardItemProps) {
  const imageUrl = resolveImageUrl(image, imageQuality);
  const missing = binderMode && !isInCollection;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const didLongPressRef = useRef(false);

  const clearLongPress = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    originRef.current = null;
  };

  const startLongPress = (x: number, y: number) => {
    if (!onLongPress) return;
    clearLongPress();
    didLongPressRef.current = false;
    originRef.current = { x, y };
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      didLongPressRef.current = true;
      onLongPress(id);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(12);
      }
    }, LONG_PRESS_MS);
  };

  const frameClass = markMode
    ? isSelected
      ? "ring-2 ring-[var(--color-accent)] shadow-[0_0_20px_-6px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]"
      : "ring-1 ring-dashed ring-[var(--color-border)]"
    : binderMode
      ? isInCollection
        ? "ring-2 ring-[var(--color-success)] shadow-[0_0_18px_-8px_color-mix(in_srgb,var(--color-success)_45%,transparent)]"
        : "ring-1 ring-[var(--color-border)]"
      : isInCollection
        ? "ring-2 ring-[var(--color-success)]"
        : "ring-1 ring-[var(--color-border)]";

  return (
    <button
      type="button"
      onClick={() => {
        if (didLongPressRef.current) {
          didLongPressRef.current = false;
          return;
        }
        onPress(id);
      }}
      onPointerDown={(e) => {
        if (!onLongPress || e.button !== 0) return;
        startLongPress(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        const origin = originRef.current;
        if (!origin || timerRef.current == null) return;
        const dx = e.clientX - origin.x;
        const dy = e.clientY - origin.y;
        if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
          clearLongPress();
        }
      }}
      onPointerUp={clearLongPress}
      onPointerCancel={clearLongPress}
      onContextMenu={(e) => {
        if (onLongPress) e.preventDefault();
      }}
      aria-pressed={markMode ? isSelected : undefined}
      className={`group w-full rounded-xl text-left transition duration-200 hover:-translate-y-1 active:translate-y-0 touch-manipulation select-none [-webkit-touch-callout:none] ${compact ? "" : "space-y-2"}`}
    >
      <div
        className={`ui-sheen relative overflow-hidden rounded-xl bg-[var(--color-bg-card)] shadow-[0_10px_28px_-18px_rgba(0,0,0,0.55)] transition duration-200 group-hover:shadow-[0_16px_36px_-14px_color-mix(in_srgb,var(--color-accent)_30%,transparent)] ${frameClass} ${
          compact ? "aspect-[0.715]" : "aspect-[0.72]"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={missing ? `${name} (não possuída)` : name}
            draggable={false}
            className={`pointer-events-none h-full w-full transition duration-300 group-hover:scale-[1.02] ${compact ? "object-cover" : "object-contain p-1"} ${
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
            className={`absolute top-1.5 left-1.5 z-[3] flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
              isSelected
                ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                : "bg-black/50 text-white/90"
            }`}
            aria-hidden
          >
            {isSelected ? (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 4 4L19 6" />
              </svg>
            ) : null}
          </span>
        ) : null}
        <span
          className={`absolute right-1.5 bottom-1.5 z-[3] rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-md ${
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
