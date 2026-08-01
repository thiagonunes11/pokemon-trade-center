import { forwardRef } from "react";

export type ShowcaseShareCard = {
  id: string;
  name: string;
  image: string | null;
};

function resolveImageUrl(image: string | null): string | null {
  if (!image) return null;
  const lower = image.toLowerCase();
  if (lower.endsWith("/high.webp") || lower.endsWith("/high.png")) {
    return image;
  }
  return `${image}/high.webp`;
}

interface ShareShowcaseBinderProps {
  ownerLabel?: string | null;
  cards: ShowcaseShareCard[];
}

export const ShareShowcaseBinder = forwardRef<
  HTMLDivElement,
  ShareShowcaseBinderProps
>(function ShareShowcaseBinder({ ownerLabel, cards }, ref) {
  const cols = cards.length <= 4 ? 2 : cards.length <= 9 ? 3 : 4;

  return (
    <div
      ref={ref}
      className="w-[720px] bg-[var(--color-bg)] p-8 text-[var(--color-text)]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <p className="text-sm font-medium tracking-wide text-[var(--color-accent)]">
        Pokemon Trade Center
      </p>
      <h2
        className="mt-2 text-3xl font-extrabold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Minha vitrine
      </h2>
      {ownerLabel ? (
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {ownerLabel}
        </p>
      ) : null}
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        {cards.length} {cards.length === 1 ? "carta" : "cartas"}
      </p>
      <div
        className="mt-6 grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => {
          const src = resolveImageUrl(card.image);
          return (
            <div
              key={card.id}
              className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]"
            >
              {src ? (
                <img
                  src={src}
                  alt={card.name}
                  crossOrigin="anonymous"
                  className="aspect-[0.715] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[0.715] items-center justify-center text-xs text-[var(--color-text-muted)]">
                  {card.name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
