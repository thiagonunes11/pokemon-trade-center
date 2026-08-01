import { CardGrid } from "@/features/cards";
import { CollectionPickerCard, useCollections } from "@/features/sets";
import { COLLECTIONS } from "@/lib/collections";
import { useOwnedCountsBySet } from "@/hooks/useOwnedSetCount";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

type SearchHit = {
  id: string;
  name: string;
  localId: string;
  image: string | null;
  rarity: string;
  setId: string;
};

export function CatalogPage() {
  const navigate = useNavigate();
  const queries = useCollections();
  const ownedBySet = useOwnedCountsBySet();
  const userId = useAuthStore((s) => s.userId);
  const collectionCards = useCollectionStore((s) => s.cards);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const needle = normalizeSearch(deferredSearch);

  const ownedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of collectionCards) {
      if ((c.ownerId ?? null) === (userId ?? null)) ids.add(c.id);
    }
    return ids;
  }, [collectionCards, userId]);

  const setsLoading = queries.some((q) => q.isLoading);
  const setsReady = queries.every((q) => !q.isLoading);
  const setPayloads = queries.map((q) => q.data);

  const searchHits = useMemo(() => {
    if (needle.length < 2) return [] as SearchHit[];

    const hits: SearchHit[] = [];
    for (let i = 0; i < COLLECTIONS.length; i++) {
      const collection = COLLECTIONS[i];
      const set = setPayloads[i];
      const cards = set?.cards;
      if (!cards) continue;

      for (const card of cards) {
        const name = typeof card.name === "string" ? card.name : "";
        if (!normalizeSearch(name).includes(needle)) continue;
        hits.push({
          id: card.id,
          name,
          localId: String(card.localId),
          image: card.image ?? null,
          rarity: collection.name,
          setId: collection.id,
        });
      }
    }

    hits.sort((a, b) => {
      const byName = a.name.localeCompare(b.name, "pt-BR");
      if (byName !== 0) return byName;
      return a.setId.localeCompare(b.setId);
    });
    return hits;
  }, [needle, setPayloads]);

  const isSearching = needle.length >= 2;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="font-[family-name:var(--font-mono)] text-[11px] font-medium tracking-[0.14em] text-[var(--color-accent)] uppercase">
          Megaevolução
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
          Coleções
        </h1>
        <p className="max-w-xl text-[var(--color-text-secondary)]">
          Escolha uma expansão, complete sua vitrine e compartilhe o progresso.
        </p>
      </header>

      <div className="space-y-2">
        <label className="sr-only" htmlFor="catalog-card-search">
          Buscar carta pelo nome
        </label>
        <input
          id="catalog-card-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar carta (ex.: Pikachu)"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
        />
        {isSearching ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            {setsLoading
              ? "Carregando catálogo…"
              : searchHits.length === 0
                ? "Nenhuma carta encontrada."
                : `${searchHits.length} ocorrência${searchHits.length === 1 ? "" : "s"}`}
          </p>
        ) : search.trim().length > 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            Digite pelo menos 2 letras para buscar.
          </p>
        ) : null}
      </div>

      {isSearching ? (
        setsReady && searchHits.length > 0 ? (
          <CardGrid
            cards={searchHits}
            ownedIds={ownedIds}
            binderMode
            onCardPress={(id) => navigate(`/card/${id}`)}
          />
        ) : null
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          {COLLECTIONS.map((collection, index) => {
            const query = queries[index];
            const set = query?.data;
            const total =
              set?.cardCount?.total ?? set?.cards?.length ?? undefined;

            return (
              <CollectionPickerCard
                key={collection.id}
                collection={collection}
                owned={ownedBySet[collection.id] ?? 0}
                total={total}
                isLoading={query?.isLoading ?? true}
                onSelect={(setId) => navigate(`/catalog/${setId}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
