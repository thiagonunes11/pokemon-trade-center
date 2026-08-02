import { ProgressFolio } from "@/components/ProgressFolio";
import { EmptyState } from "@/components/EmptyState";
import { IconStar } from "@/components/IconStar";
import { SegmentTabs } from "@/components/SegmentTabs";
import { CardItem } from "@/features/cards";
import { toggleCardInShowcase } from "@/features/collection";
import { ShareProfileButton } from "@/features/share";
import { ensurePublicShowcaseSynced } from "@/features/profile";
import { getCollectionById, COLLECTIONS } from "@/lib/collections";
import {
  cardLocalId,
  compareBySetAndNumber,
  normalizeSearch,
  setSortIndex,
} from "@/lib/cardOrder";
import { useCollections } from "@/features/sets";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type DisplayMode = "all" | "bySet" | "showcase";

const displayOptions: Array<{ key: DisplayMode; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "bySet", label: "Por coleção" },
  { key: "showcase", label: "Vitrine" },
];

const cardGridClass =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

function ShowcasePin({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={active ? "Remover da vitrine" : "Adicionar à vitrine"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`absolute top-2 left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold shadow-md transition ${
        active
          ? "bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[0_8px_20px_-8px_color-mix(in_srgb,var(--color-accent)_80%,transparent)] ring-2 ring-[color-mix(in_srgb,var(--color-accent)_40%,transparent)]"
          : "border border-white/15 bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
      }`}
    >
      <IconStar className="h-4 w-4" filled={active} />
    </button>
  );
}

export function CollectionPage() {
  const navigate = useNavigate();
  const authUserId = useAuthStore((s) => s.userId);
  const allCards = useCollectionStore((s) => s.cards);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const needle = normalizeSearch(deferredSearch);
  const queries = useCollections();
  useScrollMemory();

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

  const filteredCards = useMemo(() => {
    if (needle.length < 2) return cards;
    return cards.filter((c) => normalizeSearch(c.name).includes(needle));
  }, [cards, needle]);

  const showcaseCards = useMemo(
    () => filteredCards.filter((c) => Boolean(c.inShowcase)),
    [filteredCards],
  );

  const sortedCards = useMemo(
    () => [...filteredCards].sort(compareBySetAndNumber),
    [filteredCards],
  );

  const sortedShowcase = useMemo(
    () => [...showcaseCards].sort(compareBySetAndNumber),
    [showcaseCards],
  );

  const showcaseCount = useMemo(
    () => cards.filter((c) => Boolean(c.inShowcase)).length,
    [cards],
  );

  // Mantém o espelho público alinhado com as ★ locais
  useEffect(() => {
    if (!authUserId) return;
    void ensurePublicShowcaseSynced(authUserId).catch((err) =>
      console.warn("[Collection] showcase sync", err),
    );
  }, [authUserId, showcaseCount]);

  const cardsBySet = useMemo(() => {
    const groups = filteredCards.reduce<Record<string, typeof filteredCards>>(
      (acc, card) => {
        (acc[card.setId] ??= []).push(card);
        return acc;
      },
      {},
    );
    return Object.entries(groups)
      .sort(([a], [b]) => setSortIndex(a) - setSortIndex(b))
      .map(([setId, setCards]) => [
        setId,
        [...setCards].sort(compareBySetAndNumber),
      ] as const);
  }, [filteredCards]);

  const isSearching = needle.length >= 2;

  return (
    <div className="relative space-y-5 pb-24">
      <header className="space-y-4">
        <div className="space-y-1">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Minha coleção
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {cards.length === 0
              ? "Seu binder está vazio."
              : `${cards.length} carta${cards.length === 1 ? "" : "s"} · ${showcaseCount} na vitrine`}
          </p>
        </div>

        {cards.length > 0 ? (
          <>
            <div className="ui-glass ui-spotlight space-y-1 rounded-2xl p-3">
              <label className="sr-only" htmlFor="collection-card-search">
                Buscar na coleção
              </label>
              <input
                id="collection-card-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar na coleção (ex.: Pikachu)"
                autoComplete="off"
                spellCheck={false}
                className="ui-input"
                onMouseMove={(e) => {
                  const el = e.currentTarget.closest(".ui-spotlight") as HTMLElement | null;
                  if (!el) return;
                  const r = el.getBoundingClientRect();
                  el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
                  el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
                }}
              />
              {isSearching ? (
                <p className="px-0.5 pt-1 text-xs text-[var(--color-text-muted)]">
                  {filteredCards.length === 0
                    ? "Nenhuma carta encontrada."
                    : `${filteredCards.length} ocorrência${filteredCards.length === 1 ? "" : "s"}`}
                </p>
              ) : search.trim().length > 0 ? (
                <p className="px-0.5 pt-1 text-xs text-[var(--color-text-muted)]">
                  Digite pelo menos 2 letras para buscar.
                </p>
              ) : null}
            </div>

            <SegmentTabs
              layoutId="collection-display-tab"
              aria-label="Organizar coleção"
              value={displayMode}
              onChange={setDisplayMode}
              options={displayOptions}
            />
          </>
        ) : null}
      </header>

      {cards.length === 0 ? (
        <EmptyState
          title="Seu binder está vazio"
          description="Abra uma expansão no catálogo e toque nas cartas que você já tem."
          action={
            <button type="button" className="ui-btn-accent min-h-11 px-4 text-sm" onClick={() => navigate("/catalog")}>
              Explorar catálogo
            </button>
          }
        />
      ) : isSearching && filteredCards.length === 0 ? (
        <EmptyState
          title="Nenhuma carta encontrada"
          description="Tente buscar por outro nome ou limpe a pesquisa."
          action={
            <button type="button" className="ui-tool-btn" onClick={() => setSearch("")}>
              Limpar busca
            </button>
          }
        />
      ) : displayMode === "showcase" ? (
        <div className="space-y-4">
          <ShareProfileButton />
          {sortedShowcase.length === 0 ? (
            <div className="ui-empty space-y-3">
              <p className="text-[var(--color-text-secondary)]">
                {isSearching
                  ? "Nenhuma carta da vitrine corresponde à busca."
                  : "Nenhuma carta na vitrine ainda."}
              </p>
              {!isSearching ? (
                <>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Toque na estrela nas cartas da coleção para montar o que
                    quer mostrar.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDisplayMode("all")}
                    className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    Ir para Todas
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <div className={cardGridClass}>
              {sortedShowcase.map((card) => (
                <div key={card.id} className="relative">
                  <ShowcasePin
                    active
                    onToggle={() => toggleCardInShowcase(card.id)}
                  />
                  <CardItem
                    id={card.id}
                    name={card.name}
                    localId={cardLocalId(card.id, card.setId)}
                    image={card.imageUrl}
                    compact
                    onPress={(id) => navigate(`/card/${id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : displayMode === "all" ? (
        <div className={cardGridClass}>
          {sortedCards.map((card) => (
            <div key={card.id} className="relative">
              <ShowcasePin
                active={Boolean(card.inShowcase)}
                onToggle={() => toggleCardInShowcase(card.id)}
              />
              <CardItem
                id={card.id}
                name={card.name}
                localId={cardLocalId(card.id, card.setId)}
                image={card.imageUrl}
                compact
                onPress={(id) => navigate(`/card/${id}`)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {cardsBySet.map(([setId, setCards]) => {
            const total = totalsBySet[setId];
            const setName = getCollectionById(setId)?.name ?? setId;
            const setLoading = COLLECTIONS.some((c, i) => {
              if (c.id !== setId) return false;
              return queries[i]?.isLoading ?? true;
            });

            return (
              <section
                key={setId}
                className="ui-glass ui-card-lift ui-sheen ui-spotlight overflow-hidden rounded-2xl"
                onMouseMove={(e) => {
                  const el = e.currentTarget;
                  const r = el.getBoundingClientRect();
                  el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
                  el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
                }}
              >
                <div className="space-y-3 p-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/catalog/${setId}`)}
                    className="w-full space-y-3 rounded-xl text-left transition hover:opacity-95"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="min-w-0 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-text)]">
                        {setName}
                      </h2>
                      <span className="shrink-0 text-sm font-semibold text-[var(--color-accent)]">
                        Abrir →
                      </span>
                    </div>
                    <ProgressFolio
                      owned={setCards.length}
                      total={total}
                      isLoading={setLoading && total == null}
                    />
                  </button>

                  <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {setCards.map((card) => (
                      <div
                        key={card.id}
                        className="relative w-[46%] min-w-[148px] max-w-[180px] shrink-0 sm:w-[30%] sm:max-w-[160px]"
                      >
                        <ShowcasePin
                          active={Boolean(card.inShowcase)}
                          onToggle={() => toggleCardInShowcase(card.id)}
                        />
                        <CardItem
                          id={card.id}
                          name={card.name}
                          localId={cardLocalId(card.id, card.setId)}
                          image={card.imageUrl}
                          compact
                          onPress={(id) => navigate(`/card/${id}`)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
