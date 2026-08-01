import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { CardItem } from "./CardItem";

type GridCard = {
  id: string;
  name: string;
  localId: string;
  image?: string | null;
  rarity?: string;
};

interface CardGridProps {
  cards: GridCard[];
  ownedIds?: Set<string>;
  binderMode?: boolean;
  onCardPress: (id: string) => void;
}

/** Espelhamento dos breakpoints do grid Tailwind (2 → 6 cols). */
function useGridColumns() {
  const [columns, setColumns] = useState(() =>
    typeof window === "undefined" ? 2 : readColumns(),
  );

  useEffect(() => {
    const update = () => setColumns(readColumns());
    const queries = [
      "(min-width: 1280px)",
      "(min-width: 1024px)",
      "(min-width: 768px)",
      "(min-width: 640px)",
    ].map((q) => window.matchMedia(q));

    update();
    queries.forEach((mql) => mql.addEventListener("change", update));
    return () =>
      queries.forEach((mql) => mql.removeEventListener("change", update));
  }, []);

  return columns;
}

function readColumns() {
  if (window.matchMedia("(min-width: 1280px)").matches) return 6;
  if (window.matchMedia("(min-width: 1024px)").matches) return 5;
  if (window.matchMedia("(min-width: 768px)").matches) return 4;
  if (window.matchMedia("(min-width: 640px)").matches) return 3;
  return 2;
}

export function CardGrid({
  cards,
  ownedIds,
  binderMode = false,
  onCardPress,
}: CardGridProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const columns = useGridColumns();
  const rowCount = cards.length === 0 ? 0 : Math.ceil(cards.length / columns);
  const [scrollMargin, setScrollMargin] = useState(0);

  const measureScrollMargin = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    setScrollMargin(top);
  }, []);

  useLayoutEffect(() => {
    measureScrollMargin();
  }, [measureScrollMargin, cards.length, columns]);

  useEffect(() => {
    measureScrollMargin();
    window.addEventListener("resize", measureScrollMargin);
    return () => window.removeEventListener("resize", measureScrollMargin);
  }, [measureScrollMargin]);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 280,
    overscan: 4,
    scrollMargin,
  });

  if (cards.length === 0) {
    return null;
  }

  return (
    <div
      ref={listRef}
      className="relative w-full"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const start = virtualRow.index * columns;
        const rowCards = cards.slice(start, start + columns);

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 left-0 w-full"
            style={{
              transform: `translateY(${virtualRow.start - scrollMargin}px)`,
            }}
          >
            <div
              className="grid gap-3 pb-3"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {rowCards.map((card) => (
                <CardItem
                  key={card.id}
                  id={card.id}
                  name={card.name}
                  localId={card.localId}
                  image={card.image ?? null}
                  rarity={card.rarity}
                  imageQuality="low"
                  isInCollection={ownedIds?.has(card.id)}
                  binderMode={binderMode}
                  onPress={onCardPress}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
