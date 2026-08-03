import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { NationalSpecies } from "./types";

interface PokedexGridProps {
  species: NationalSpecies[];
  ownedDexIds: Set<number>;
}

function useGridColumns() {
  const [columns, setColumns] = useState(() =>
    typeof window === "undefined" ? 3 : readColumns(),
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
  if (window.matchMedia("(min-width: 1280px)").matches) return 8;
  if (window.matchMedia("(min-width: 1024px)").matches) return 7;
  if (window.matchMedia("(min-width: 768px)").matches) return 6;
  if (window.matchMedia("(min-width: 640px)").matches) return 5;
  return 3;
}

function formatDexNumber(dexId: number): string {
  return `#${String(dexId).padStart(3, "0")}`;
}

function SpeciesCell({
  species,
  owned,
}: {
  species: NationalSpecies;
  owned: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const label = `${formatDexNumber(species.dexId)} ${species.name}, ${
    owned ? "na Pokédex" : "faltando"
  }`;

  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-3 text-center transition ${
        owned
          ? "ring-1 ring-[color-mix(in_srgb,var(--color-accent)_45%,transparent)]"
          : "opacity-45 grayscale"
      }`}
      aria-label={label}
    >
      <span className="font-[family-name:var(--font-mono)] text-[10px] font-medium tracking-wide text-[var(--color-text-muted)]">
        {formatDexNumber(species.dexId)}
      </span>
      <div className="mt-1 flex h-14 w-14 items-center justify-center">
        {!imgFailed ? (
          <img
            src={species.spriteUrl}
            alt=""
            width={56}
            height={56}
            loading="lazy"
            decoding="async"
            className="h-14 w-14 object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg)] text-sm font-bold text-[var(--color-text-muted)]"
            aria-hidden
          >
            {species.name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <p className="mt-1 line-clamp-2 w-full text-xs font-semibold leading-snug text-[var(--color-text)]">
        {species.name}
      </p>
    </div>
  );
}

export function PokedexGrid({ species, ownedDexIds }: PokedexGridProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const columns = useGridColumns();
  const rowCount =
    species.length === 0 ? 0 : Math.ceil(species.length / columns);
  const [scrollMargin, setScrollMargin] = useState(0);

  const measureScrollMargin = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    setScrollMargin(top);
  }, []);

  useLayoutEffect(() => {
    measureScrollMargin();
  }, [measureScrollMargin, species.length, columns]);

  useEffect(() => {
    measureScrollMargin();
    window.addEventListener("resize", measureScrollMargin);
    return () => window.removeEventListener("resize", measureScrollMargin);
  }, [measureScrollMargin]);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 140,
    overscan: 6,
    scrollMargin,
  });

  if (species.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="relative w-full"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const start = virtualRow.index * columns;
        const row = species.slice(start, start + columns);

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
              className="grid gap-2 pb-2 sm:gap-3 sm:pb-3"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {row.map((entry) => (
                <SpeciesCell
                  key={entry.dexId}
                  species={entry}
                  owned={ownedDexIds.has(entry.dexId)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
