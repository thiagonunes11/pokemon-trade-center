import { CardGrid, useSetCards } from "@/features/cards";
import {
  addCardToCollection,
  removeCardFromCollection,
} from "@/features/collection";
import { addCardToWanted } from "@/features/trades";
import { BackButton } from "@/components/BackButton";
import { ProgressFolio } from "@/components/ProgressFolio";
import { getCollectionById, isSupportedSetId } from "@/lib/collections";
import { compareByLocalId } from "@/lib/cardOrder";
import { useOwnedSetCount } from "@/hooks/useOwnedSetCount";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTradeStore } from "@/store/useTradeStore";
import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";

type SetFilter = "all" | "owned" | "missing";

const filterOptions: Array<{ key: SetFilter; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "owned", label: "Tenho" },
  { key: "missing", label: "Faltam" },
];

function IconRefresh({ className }: { className?: string }) {
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
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function CatalogSetPage() {
  const { setId = "" } = useParams();
  const navigate = useNavigate();
  const valid = isSupportedSetId(setId);
  const collection = getCollectionById(setId);
  const { data: setData, isLoading, error, refetch, isFetching } =
    useSetCards(valid ? setId : "");
  const owned = useOwnedSetCount(valid ? setId : null);
  const userId = useAuthStore((s) => s.userId);
  const cards = useCollectionStore((s) => s.cards);
  const wanted = useTradeStore((s) => s.wanted);
  const [filter, setFilter] = useState<SetFilter>("all");
  const [markMode, setMarkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [wantedHint, setWantedHint] = useState<string | null>(null);

  useScrollMemory(valid && !isLoading && !error);

  const ownedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of cards) {
      if ((c.ownerId ?? null) === (userId ?? null)) ids.add(c.id);
    }
    return ids;
  }, [cards, userId]);

  const wantedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of wanted) {
      if ((c.ownerId ?? null) === (userId ?? null)) ids.add(c.id);
    }
    return ids;
  }, [wanted, userId]);

  const gridCards = useMemo(() => {
    const mapped =
      setData?.cards?.map((c) => ({
        id: c.id,
        name: c.name,
        localId: String(c.localId),
        image: c.image ?? null,
      })) ?? [];
    return mapped.sort(compareByLocalId);
  }, [setData?.cards]);

  const missingCards = useMemo(
    () => gridCards.filter((c) => !ownedIds.has(c.id)),
    [gridCards, ownedIds],
  );

  const missingNotWanted = useMemo(
    () => missingCards.filter((c) => !wantedIds.has(c.id)),
    [missingCards, wantedIds],
  );

  const filteredCards = useMemo(() => {
    if (filter === "owned") {
      return gridCards.filter((c) => ownedIds.has(c.id));
    }
    if (filter === "missing") {
      return gridCards.filter((c) => !ownedIds.has(c.id));
    }
    return gridCards;
  }, [filter, gridCards, ownedIds]);

  const selectedCount = selectedIds.size;
  const selectedOwnedCount = useMemo(() => {
    let n = 0;
    for (const id of selectedIds) {
      if (ownedIds.has(id)) n += 1;
    }
    return n;
  }, [selectedIds, ownedIds]);
  const selectedMissingCount = selectedCount - selectedOwnedCount;
  const selectedMissingNotWanted = useMemo(() => {
    let n = 0;
    for (const id of selectedIds) {
      if (!ownedIds.has(id) && !wantedIds.has(id)) n += 1;
    }
    return n;
  }, [selectedIds, ownedIds, wantedIds]);

  const missingCount = Math.max(
    (setData?.cardCount?.total ?? gridCards.length) - owned,
    0,
  );

  const toWantedInput = (card: (typeof gridCards)[number]) => ({
    id: card.id,
    name: card.name,
    imageUrl: card.image ? `${card.image}/high.webp` : null,
    setId,
  });

  const exitMarkMode = () => {
    setMarkMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (cardId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const addSelected = () => {
    for (const id of selectedIds) {
      const card = gridCards.find((c) => c.id === id);
      if (!card || ownedIds.has(id)) continue;
      addCardToCollection({
        id: card.id,
        name: card.name,
        imageUrl: card.image ? `${card.image}/high.webp` : null,
        setId,
      });
    }
    setSelectedIds(new Set());
  };

  const removeSelected = () => {
    for (const id of selectedIds) {
      if (ownedIds.has(id)) removeCardFromCollection(id);
    }
    setSelectedIds(new Set());
  };

  const addCardsToWanted = (cardsToAdd: typeof gridCards) => {
    let added = 0;
    for (const card of cardsToAdd) {
      if (wantedIds.has(card.id)) continue;
      addCardToWanted(toWantedInput(card));
      added += 1;
    }
    if (added === 0) {
      setWantedHint("Essas cartas já estão em Procurando.");
    } else {
      setWantedHint(
        added === 1
          ? "1 carta adicionada à Procurando."
          : `${added} cartas adicionadas à Procurando.`,
      );
    }
  };

  const addMissingToWanted = () => {
    addCardsToWanted(missingNotWanted);
  };

  const addSelectedToWanted = () => {
    const cardsToAdd = gridCards.filter(
      (c) =>
        selectedIds.has(c.id) && !ownedIds.has(c.id) && !wantedIds.has(c.id),
    );
    addCardsToWanted(cardsToAdd);
    setSelectedIds(new Set());
  };

  if (!valid) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--color-error)]">Expansão não encontrada.</p>
        <BackButton to="/catalog">Coleções</BackButton>
      </div>
    );
  }

  const total =
    setData?.cardCount?.total ?? setData?.cards?.length ?? 0;
  const setName = collection?.name ?? setId;

  return (
    <div className={`space-y-5 ${markMode ? "pb-28" : ""}`}>
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <BackButton to="/catalog">Coleções</BackButton>
          <div className="flex items-center gap-2">
            {!isLoading && !error && gridCards.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (markMode) exitMarkMode();
                  else setMarkMode(true);
                }}
                aria-pressed={markMode}
                className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-bold transition ${
                  markMode
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                }`}
              >
                {markMode ? "Concluir" : "Marcar"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label={isFetching ? "Atualizando" : "Atualizar cartas"}
              title="Atualizar"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
            >
              <IconRefresh
                className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-3xl">
            {setName}
          </h1>
          <ProgressFolio
            owned={owned}
            total={total > 0 ? total : undefined}
            isLoading={isLoading}
          />
          {!isLoading && !error && missingNotWanted.length > 0 && !markMode ? (
            <button
              type="button"
              onClick={addMissingToWanted}
              className="w-full min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-sm font-bold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] sm:w-auto"
            >
              Procurar faltantes ({missingNotWanted.length})
            </button>
          ) : null}
          {wantedHint ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {wantedHint}{" "}
              <button
                type="button"
                onClick={() => navigate("/trades?tab=wanted")}
                className="font-semibold text-[var(--color-accent)] hover:underline"
              >
                Ver Procurando
              </button>
            </p>
          ) : null}
        </div>
      </header>

      {!isLoading && !error && gridCards.length > 0 ? (
        <div
          className="flex rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-1"
          role="tablist"
          aria-label="Filtrar cartas"
        >
          {filterOptions.map((opt) => {
            const count =
              opt.key === "all"
                ? gridCards.length
                : opt.key === "owned"
                  ? owned
                  : missingCount;
            const active = filter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(opt.key)}
                className={`flex min-h-11 flex-1 flex-col items-center justify-center rounded-lg px-2 py-1.5 text-xs font-semibold transition sm:flex-row sm:gap-1.5 sm:text-sm ${
                  active
                    ? "bg-[var(--color-bg-elevated)] text-[var(--color-text)] ring-1 ring-[var(--color-accent)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`font-[family-name:var(--font-mono)] text-[10px] sm:text-xs ${
                    active
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {isLoading && (
        <p className="text-[var(--color-text-secondary)]">
          Carregando cartas…
        </p>
      )}

      {error && (
        <p className="text-[var(--color-error)]">
          Não foi possível carregar este set. Tente atualizar.
        </p>
      )}

      {!isLoading && !error && filteredCards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
          {filter === "owned"
            ? "Você ainda não tem cartas deste set."
            : filter === "missing"
              ? "Nada faltando — set completo!"
              : "Nenhuma carta neste set."}
        </p>
      ) : null}

      {!isLoading && !error && filteredCards.length > 0 ? (
        <CardGrid
          cards={filteredCards}
          ownedIds={ownedIds}
          selectedIds={selectedIds}
          binderMode
          markMode={markMode}
          onCardPress={(id) => {
            if (markMode) {
              toggleSelected(id);
              return;
            }
            navigate(`/card/${id}`);
          }}
        />
      ) : null}

      {markMode ? (
        <div className="fixed inset-x-0 bottom-[4.5rem] z-30 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]/95 px-4 py-3 backdrop-blur-md md:bottom-0 md:left-60">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {selectedCount === 0
                ? "Toque nas cartas para selecionar."
                : `${selectedCount} selecionada${selectedCount === 1 ? "" : "s"}`}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={selectedMissingCount === 0}
                onClick={addSelected}
                className="min-h-11 flex-1 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-bold text-[var(--color-on-accent)] disabled:opacity-40 sm:flex-none"
              >
                Adicionar selecionadas
                {selectedMissingCount > 0 ? ` (${selectedMissingCount})` : ""}
              </button>
              <button
                type="button"
                disabled={selectedMissingNotWanted === 0}
                onClick={addSelectedToWanted}
                className="min-h-11 flex-1 rounded-xl border border-[var(--color-accent)] px-4 text-sm font-bold text-[var(--color-accent)] disabled:opacity-40 sm:flex-none"
              >
                À Procurando
                {selectedMissingNotWanted > 0
                  ? ` (${selectedMissingNotWanted})`
                  : ""}
              </button>
              <button
                type="button"
                disabled={selectedOwnedCount === 0}
                onClick={removeSelected}
                className="min-h-11 flex-1 rounded-xl border border-[var(--color-error)] px-4 text-sm font-bold text-[var(--color-error)] disabled:opacity-40 sm:flex-none"
              >
                Remover seleção
                {selectedOwnedCount > 0 ? ` (${selectedOwnedCount})` : ""}
              </button>
              <button
                type="button"
                onClick={exitMarkMode}
                className="min-h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text-secondary)]"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
