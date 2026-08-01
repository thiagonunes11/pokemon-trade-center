import { ProgressFolio } from "@/components/ProgressFolio";
import { forwardRef } from "react";

export type ShareBinderCard = {
  id: string;
  name: string;
  localId: string;
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

interface ShareSetBinderProps {
  setName: string;
  cards: ShareBinderCard[];
  ownedIds: Set<string>;
  owned: number;
  total: number;
}

export const ShareSetBinder = forwardRef<HTMLDivElement, ShareSetBinderProps>(
  function ShareSetBinder(
    { setName, cards, ownedIds, owned, total },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className="w-[720px] bg-[var(--color-bg)] p-8 text-[var(--color-text)]"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <p
          className="text-sm tracking-wide text-[var(--color-text-muted)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Pokemon Trade Center
        </p>
        <h2
          className="mt-2 text-3xl font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {setName}
        </h2>
        <div className="mt-4 max-w-xs">
          <ProgressFolio owned={owned} total={total} />
        </div>
        <div className="mt-6 grid grid-cols-6 gap-2">
          {cards.map((card) => {
            const ownedCard = ownedIds.has(card.id);
            const src = resolveImageUrl(card.image);
            return (
              <div
                key={card.id}
                className="aspect-[0.715] overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-bg-card)]"
              >
                {src ? (
                  <img
                    src={src}
                    alt=""
                    crossOrigin="anonymous"
                    className={`h-full w-full object-cover ${
                      ownedCard ? "" : "opacity-40 grayscale"
                    }`}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-[var(--color-text-muted)]">
                    —
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
