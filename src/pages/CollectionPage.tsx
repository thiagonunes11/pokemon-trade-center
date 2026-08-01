import { ProgressFolio } from "@/components/ProgressFolio";
import { CardItem } from "@/features/cards";
import { getCollectionById } from "@/lib/collections";
import { useCollections } from "@/features/sets";
import { COLLECTIONS } from "@/lib/collections";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type DisplayMode = "all" | "bySet";

const displayOptions: Array<{ key: DisplayMode; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "bySet", label: "Por coleção" },
];

export function CollectionPage() {
  const navigate = useNavigate();
  const authUserId = useAuthStore((s) => s.userId);
  const allCards = useCollectionStore((s) => s.cards);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const queries = useCollections();

  const totalsBySet = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    COLLECTIONS.forEach((c, index) => {
      const set = queries[index]?.data;
      map[c.id] = set?.cardCount?.total ?? set?.cards?.length;
    });
    return map;
  }, [queries]);

  const cards = useMemo(
    () =>
      allCards.filter((c) => (c.ownerId ?? null) === (authUserId ?? null)),
    [allCards, authUserId],
  );

  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => a.name.localeCompare(b.name)),
    [cards],
  );

  const cardsBySet = useMemo(() => {
    const groups = cards.reduce<Record<string, typeof cards>>((acc, card) => {
      (acc[card.setId] ??= []).push(card);
      return acc;
    }, {});
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [cards]);

  return (
    <div className="relative space-y-6 pb-20">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-text)]">
          Minha coleção
        </h1>
        <p className="font-[family-name:var(--font-serif)] text-sm text-[var(--color-text-secondary)]">
          {cards.length === 0
            ? "Nenhuma carta ainda — adicione pelo catálogo"
            : `${cards.length} carta${cards.length === 1 ? "" : "s"} · ${displayOptions.find((o) => o.key === displayMode)?.label}`}
        </p>
      </header>

      {cards.length === 0 ? (
        <p className="border border-dashed border-[var(--color-border)] p-8 text-center text-[var(--color-text-muted)]">
          Sua vitrine está vazia neste navegador.
        </p>
      ) : displayMode === "all" ? (
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          {sortedCards.map((card) => (
            <CardItem
              key={card.id}
              id={card.id}
              name={card.name}
              localId={card.id.split("-").pop() ?? ""}
              image={card.imageUrl}
              compact
              isInCollection
              onPress={(id) => navigate(`/card/${id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {cardsBySet.map(([setId, setCards]) => {
            const total = totalsBySet[setId];
            return (
              <section key={setId} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-text)]">
                      {getCollectionById(setId)?.name ?? setId}
                    </h2>
                    <ProgressFolio
                      owned={setCards.length}
                      total={total}
                      className="max-w-xs"
                    />
                  </div>
                  <Link
                    to={`/catalog/${setId}`}
                    className="text-sm font-medium text-[var(--color-accent)] hover:underline"
                  >
                    Ver binder / compartilhar
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-1 sm:gap-2">
                  {[...setCards]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((card) => (
                      <CardItem
                        key={card.id}
                        id={card.id}
                        name={card.name}
                        localId={card.id.split("-").pop() ?? ""}
                        image={card.imageUrl}
                        compact
                        isInCollection
                        onPress={(id) => navigate(`/card/${id}`)}
                      />
                    ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-20 right-4 z-30 md:bottom-6 md:right-6">
        {filterMenuOpen && (
          <div className="absolute right-0 bottom-14 mb-1 w-40 overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-lg">
            {displayOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`block w-full px-3 py-2.5 text-left text-sm ${
                  displayMode === opt.key
                    ? "bg-[var(--color-bg-elevated)] font-semibold text-[var(--color-text)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]"
                }`}
                onClick={() => {
                  setDisplayMode(opt.key);
                  setFilterMenuOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          aria-label="Filtro da coleção"
          onClick={() => setFilterMenuOpen((o) => !o)}
          className="flex items-center justify-center rounded-full bg-[var(--color-accent)] text-lg font-bold text-white shadow-lg hover:bg-[var(--color-accent-hover)]"
          style={{ width: 52, height: 52 }}
        >
          {cards.length}
        </button>
      </div>
    </div>
  );
}
