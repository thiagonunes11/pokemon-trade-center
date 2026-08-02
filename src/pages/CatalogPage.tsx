import { CardGrid } from "@/features/cards";
import { CollectionPickerCard, useCollections } from "@/features/sets";
import { COLLECTIONS } from "@/lib/collections";
import { compareBySetAndNumber, normalizeSearch } from "@/lib/cardOrder";
import { useOwnedCountsBySet } from "@/hooks/useOwnedSetCount";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type SearchHit = {
  id: string;
  name: string;
  localId: string;
  image: string | null;
  rarity: string;
  setId: string;
};

type ProgressFilter = "all" | "progress" | "complete" | "empty";
type OwnershipFilter = "all" | "owned" | "missing";

/** Controles de catálogo inspirados em Filter Grid / Selector Chips (21st.dev). */

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconClear({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition ${
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[0_8px_20px_-10px_color-mix(in_srgb,var(--color-accent)_70%,transparent)]"
          : "border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
      }`}
    >
      <span>{label}</span>
      {count != null ? (
        <span
          className={`font-[family-name:var(--font-mono)] tabular-nums ${
            active
              ? "text-[var(--color-on-accent)]/75"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function CatalogPage() {
  const navigate = useNavigate();
  const queries = useCollections();
  const ownedBySet = useOwnedCountsBySet();
  const userId = useAuthStore((s) => s.userId);
  const collectionCards = useCollectionStore((s) => s.cards);
  const [search, setSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("all");
  const [setFilter, setSetFilter] = useState<string | "all">("all");
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

  const setStats = useMemo(() => {
    return COLLECTIONS.map((collection, index) => {
      const set = setPayloads[index];
      const total =
        set?.cardCount?.total ?? set?.cards?.length ?? undefined;
      const owned = ownedBySet[collection.id] ?? 0;
      const ready = total != null && total > 0;
      const complete = ready && owned >= total;
      const empty = owned === 0;
      const inProgress = ready && owned > 0 && owned < total;
      return {
        collection,
        index,
        total,
        owned,
        ready,
        complete,
        empty,
        inProgress,
        isLoading: queries[index]?.isLoading ?? true,
      };
    });
  }, [setPayloads, ownedBySet, queries]);

  const progressCounts = useMemo(() => {
    const ready = setStats.filter((s) => s.ready);
    return {
      all: ready.length,
      progress: ready.filter((s) => s.inProgress).length,
      complete: ready.filter((s) => s.complete).length,
      empty: ready.filter((s) => s.empty).length,
    };
  }, [setStats]);

  const visibleSets = useMemo(() => {
    return setStats.filter((s) => {
      if (!s.ready && progressFilter !== "all") return false;
      if (progressFilter === "progress") return s.inProgress;
      if (progressFilter === "complete") return s.complete;
      if (progressFilter === "empty") return s.empty;
      return true;
    });
  }, [setStats, progressFilter]);

  const searchHits = useMemo(() => {
    if (needle.length < 2) return [] as SearchHit[];

    const hits: SearchHit[] = [];
    for (let i = 0; i < COLLECTIONS.length; i++) {
      const collection = COLLECTIONS[i];
      if (setFilter !== "all" && collection.id !== setFilter) continue;
      const set = setPayloads[i];
      const cards = set?.cards;
      if (!cards) continue;

      for (const card of cards) {
        const name = typeof card.name === "string" ? card.name : "";
        if (!normalizeSearch(name).includes(needle)) continue;
        const owned = ownedIds.has(card.id);
        if (ownershipFilter === "owned" && !owned) continue;
        if (ownershipFilter === "missing" && owned) continue;
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

    hits.sort(compareBySetAndNumber);
    return hits;
  }, [needle, setPayloads, setFilter, ownershipFilter, ownedIds]);

  const ownershipCounts = useMemo(() => {
    if (needle.length < 2) {
      return { all: 0, owned: 0, missing: 0 };
    }
    let all = 0;
    let owned = 0;
    let missing = 0;
    for (let i = 0; i < COLLECTIONS.length; i++) {
      const collection = COLLECTIONS[i];
      if (setFilter !== "all" && collection.id !== setFilter) continue;
      const cards = setPayloads[i]?.cards;
      if (!cards) continue;
      for (const card of cards) {
        const name = typeof card.name === "string" ? card.name : "";
        if (!normalizeSearch(name).includes(needle)) continue;
        all += 1;
        if (ownedIds.has(card.id)) owned += 1;
        else missing += 1;
      }
    }
    return { all, owned, missing };
  }, [needle, setPayloads, setFilter, ownedIds]);

  const isSearching = needle.length >= 2;

  return (
    <div className="space-y-6">
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

      {/* Barra de controle — Expandable/glow search (21st) + chips */}
      <div className="ui-glass space-y-3 rounded-2xl p-3 sm:p-4">
        <div className="relative">
          <label className="sr-only" htmlFor="catalog-card-search">
            Buscar carta pelo nome
          </label>
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            id="catalog-card-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar carta (ex.: Pikachu)"
            autoComplete="off"
            spellCheck={false}
            className="ui-input !pl-10 !pr-11"
          />
          {search ? (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
            >
              <IconClear className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {isSearching ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterChip
                active={ownershipFilter === "all"}
                label="Todas"
                count={ownershipCounts.all}
                onClick={() => setOwnershipFilter("all")}
              />
              <FilterChip
                active={ownershipFilter === "owned"}
                label="Tenho"
                count={ownershipCounts.owned}
                onClick={() => setOwnershipFilter("owned")}
              />
              <FilterChip
                active={ownershipFilter === "missing"}
                label="Faltam"
                count={ownershipCounts.missing}
                onClick={() => setOwnershipFilter("missing")}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterChip
                active={setFilter === "all"}
                label="Todos os sets"
                onClick={() => setSetFilter("all")}
              />
              {COLLECTIONS.map((c) => (
                <FilterChip
                  key={c.id}
                  active={setFilter === c.id}
                  label={c.name}
                  onClick={() => setSetFilter(c.id)}
                />
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {setsLoading
                ? "Carregando catálogo…"
                : searchHits.length === 0
                  ? "Nenhuma carta com esses filtros."
                  : `${searchHits.length} ocorrência${searchHits.length === 1 ? "" : "s"}`}
            </p>
          </>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterChip
                active={progressFilter === "all"}
                label="Todas"
                count={progressCounts.all || undefined}
                onClick={() => setProgressFilter("all")}
              />
              <FilterChip
                active={progressFilter === "progress"}
                label="Em progresso"
                count={progressCounts.progress}
                onClick={() => setProgressFilter("progress")}
              />
              <FilterChip
                active={progressFilter === "empty"}
                label="Não iniciadas"
                count={progressCounts.empty}
                onClick={() => setProgressFilter("empty")}
              />
              <FilterChip
                active={progressFilter === "complete"}
                label="Completas"
                count={progressCounts.complete}
                onClick={() => setProgressFilter("complete")}
              />
            </div>
            {search.trim().length > 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                Digite pelo menos 2 letras para buscar.
              </p>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">
                Filtre expansões ou busque uma carta em todos os sets.
              </p>
            )}
          </>
        )}
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
      ) : visibleSets.length === 0 ? (
        <p className="ui-empty text-sm">
          Nenhuma expansão neste filtro.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          {visibleSets.map((s) => (
            <CollectionPickerCard
              key={s.collection.id}
              collection={s.collection}
              owned={s.owned}
              total={s.total}
              isLoading={s.isLoading}
              onSelect={(setId) => navigate(`/catalog/${setId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
