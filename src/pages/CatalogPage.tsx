import { CardGrid } from "@/features/cards";
import { EmptyState } from "@/components/EmptyState";
import { HorizontalScrollRow } from "@/components/HorizontalScrollRow";
import {
  CollectionPickerCard,
  useCatalogCardSearch,
  useCatalogSeries,
  useSeriesSets,
} from "@/features/sets";
import { compareBySetAndNumber, normalizeSearch } from "@/lib/cardOrder";
import { CATALOG_DEFAULT_SERIES_ID } from "@/lib/tcgdex";
import { useOwnedCountsBySet } from "@/hooks/useOwnedSetCount";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

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
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition ${
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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSeriesId = searchParams.get("series");
  const seriesQuery = useCatalogSeries();
  const selectedSeriesId =
    requestedSeriesId ?? CATALOG_DEFAULT_SERIES_ID;
  const setsQuery = useSeriesSets(selectedSeriesId);
  const collections = useMemo(() => setsQuery.data ?? [], [setsQuery.data]);
  const ownedBySet = useOwnedCountsBySet();
  const userId = useAuthStore((s) => s.userId);
  const collectionCards = useCollectionStore((s) => s.cards);
  const [search, setSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("all");
  const [setFilter, setSetFilter] = useState<string | "all">("all");
  const debouncedSearch = useDebouncedValue(search, 300);
  const needle = normalizeSearch(debouncedSearch);
  const isSearching = needle.length >= 2;
  const cardSearchQuery = useCatalogCardSearch(needle, isSearching);

  const selectedSeries = seriesQuery.data?.find(
    (series) => series.id === selectedSeriesId,
  );

  const ownedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of collectionCards) {
      if ((c.ownerId ?? null) === (userId ?? null)) ids.add(c.id);
    }
    return ids;
  }, [collectionCards, userId]);

  const searchLoading = isSearching && cardSearchQuery.isLoading;
  const searchReady = isSearching && !cardSearchQuery.isLoading;

  const setStats = useMemo(() => {
    return collections.map((collection) => {
      const total = collection.cardCount.total || undefined;
      const owned = ownedBySet[collection.id] ?? 0;
      const ready = total != null && total > 0;
      const complete = ready && owned >= total;
      const empty = owned === 0;
      const inProgress = ready && owned > 0 && owned < total;
      return {
        collection,
        total,
        owned,
        ready,
        complete,
        empty,
        inProgress,
        isLoading: setsQuery.isLoading,
      };
    });
  }, [collections, ownedBySet, setsQuery.isLoading]);

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
    for (const card of cardSearchQuery.data ?? []) {
      if (setFilter !== "all" && card.setId !== setFilter) continue;
      const owned = ownedIds.has(card.id);
      if (ownershipFilter === "owned" && !owned) continue;
      if (ownershipFilter === "missing" && owned) continue;
      hits.push({
        id: card.id,
        name: card.name,
        localId: card.localId,
        image: card.image,
        rarity: card.setName,
        setId: card.setId,
      });
    }

    hits.sort(compareBySetAndNumber);
    return hits;
  }, [needle, cardSearchQuery.data, setFilter, ownershipFilter, ownedIds]);

  const ownershipCounts = useMemo(() => {
    if (needle.length < 2) {
      return { all: 0, owned: 0, missing: 0 };
    }
    let all = 0;
    let owned = 0;
    let missing = 0;
    for (const card of cardSearchQuery.data ?? []) {
      if (setFilter !== "all" && card.setId !== setFilter) continue;
      all += 1;
      if (ownedIds.has(card.id)) owned += 1;
      else missing += 1;
    }
    return { all, owned, missing };
  }, [needle, cardSearchQuery.data, setFilter, ownedIds]);

  const selectSeries = (seriesId: string) => {
    setSearchParams({ series: seriesId });
    setSetFilter("all");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
          Catálogo
        </h1>
        <p className="max-w-xl text-sm text-[var(--color-text-secondary)] sm:text-base">
          Série {selectedSeries?.name ?? selectedSeriesId} · {ownedIds.size} carta{ownedIds.size === 1 ? "" : "s"} na sua coleção
        </p>
      </header>

      <HorizontalScrollRow label="Séries do catálogo">
        {(seriesQuery.data ?? []).map((series) => (
          <FilterChip
            key={series.id}
            active={selectedSeriesId === series.id}
            label={series.name}
            onClick={() => selectSeries(series.id)}
          />
        ))}
      </HorizontalScrollRow>

      {/* Barra de controle — Expandable/glow search (21st) + chips */}
      <div className="ui-glass-strong sticky top-3 z-20 space-y-3 rounded-2xl p-3 sm:p-4">
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
            <HorizontalScrollRow label="Filtro de posse">
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
            </HorizontalScrollRow>
            <HorizontalScrollRow label="Filtro por expansão">
              <FilterChip
                active={setFilter === "all"}
                label="Todo o catálogo"
                onClick={() => setSetFilter("all")}
              />
              {collections.map((c) => (
                <FilterChip
                  key={c.id}
                  active={setFilter === c.id}
                  label={c.name}
                  onClick={() => setSetFilter(c.id)}
                />
              ))}
            </HorizontalScrollRow>
            <p className="text-xs text-[var(--color-text-muted)]">
              {searchLoading
                ? "Carregando catálogo…"
                : searchHits.length === 0
                  ? "Nenhuma carta com esses filtros."
                  : `${searchHits.length} ocorrência${searchHits.length === 1 ? "" : "s"}`}
            </p>
          </>
        ) : (
          <>
            <HorizontalScrollRow label="Filtro de progresso">
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
            </HorizontalScrollRow>
            {search.trim().length > 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                Digite pelo menos 2 letras para buscar.
              </p>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">
                Filtre expansões ou busque uma carta em todo o catálogo.
              </p>
            )}
          </>
        )}
      </div>

      {isSearching ? (
        !searchReady ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" aria-label="Carregando resultados">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="space-y-2">
                <div className="ui-skeleton aspect-[0.72]" />
                <div className="ui-skeleton h-4 w-4/5" />
              </div>
            ))}
          </div>
        ) : searchHits.length > 0 ? (
          <CardGrid
            cards={searchHits}
            ownedIds={ownedIds}
            binderMode
            onCardPress={(id) => navigate(`/card/${id}`)}
          />
        ) : (
          <EmptyState
            title="Nenhuma carta encontrada"
            description="Tente outro nome ou remova um dos filtros aplicados."
            action={
              <button
                type="button"
                className="ui-tool-btn"
                onClick={() => {
                  setSearch("");
                  setOwnershipFilter("all");
                  setSetFilter("all");
                }}
              >
                Limpar filtros
              </button>
            }
          />
        )
      ) : setsQuery.isLoading || seriesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" role="status" aria-label="Carregando expansões">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="ui-skeleton aspect-[16/10] rounded-2xl" />
          ))}
        </div>
      ) : setsQuery.error || seriesQuery.error ? (
        <EmptyState
          title="Não foi possível carregar o catálogo"
          description="Verifique sua conexão e tente novamente."
          action={
            <button type="button" className="ui-tool-btn" onClick={() => void setsQuery.refetch()}>
              Tentar novamente
            </button>
          }
        />
      ) : visibleSets.length === 0 ? (
        <EmptyState
          title="Nenhuma expansão neste filtro"
          description="Escolha outra etapa de progresso para voltar a explorar."
          action={
            <button type="button" className="ui-tool-btn" onClick={() => setProgressFilter("all")}>
              Ver todas
            </button>
          }
        />
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
