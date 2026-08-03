import { CardGrid, useSetCards } from "@/features/cards";
import {
  addCardToCollection,
  removeCardFromCollection,
} from "@/features/collection";
import { addCardToWanted, removeCardFromWanted } from "@/features/trades";
import { BackButton } from "@/components/BackButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProgressFolio } from "@/components/ProgressFolio";
import { SegmentTabs } from "@/components/SegmentTabs";
import { compareByLocalId } from "@/lib/cardOrder";
import { resolveCardImageUrl } from "@/lib/cardImages";
import { useOwnedSetCount } from "@/hooks/useOwnedSetCount";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTradeStore } from "@/store/useTradeStore";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

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
  const valid = Boolean(setId);
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
  const [confirm, setConfirm] = useState<{
    title: string;
    message?: string;
    confirmLabel: string;
    danger?: boolean;
    action: () => void;
  } | null>(null);

  useScrollMemory(valid && !isLoading && !error);

  useEffect(() => {
    if (!markMode) return;
    document.body.dataset.markMode = "true";
    return () => {
      delete document.body.dataset.markMode;
    };
  }, [markMode]);

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
        imageHigh: c.imageHigh ?? null,
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

  const missingInWanted = useMemo(
    () => missingCards.filter((c) => wantedIds.has(c.id)),
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
    imageUrl: resolveCardImageUrl(card.image, "high", card.imageHigh),
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
    let removedFromWantedCount = 0;
    for (const id of selectedIds) {
      const card = gridCards.find((c) => c.id === id);
      if (!card || ownedIds.has(id)) continue;
      const result = addCardToCollection({
        id: card.id,
        name: card.name,
        imageUrl: resolveCardImageUrl(card.image, "high", card.imageHigh),
        setId,
      });
      if (result.removedFromWanted) removedFromWantedCount += 1;
    }
    setSelectedIds(new Set());
    if (removedFromWantedCount === 1) {
      setWantedHint("1 carta removida da busca.");
    } else if (removedFromWantedCount > 1) {
      setWantedHint(`${removedFromWantedCount} cartas removidas da busca.`);
    }
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
      setWantedHint("Essas cartas já estão na busca.");
    } else {
      setWantedHint(
        added === 1
          ? "1 carta adicionada à busca."
          : `${added} cartas adicionadas à busca.`,
      );
    }
  };

  const addMissingToWanted = () => {
    const n = missingNotWanted.length;
    if (n === 0) return;
    setConfirm({
      title:
        n === 1
          ? "Adicionar 1 carta à busca?"
          : `Adicionar ${n} cartas à busca?`,
      message:
        "Só confirme se você realmente procura essas cartas. Dá para remover depois neste mesmo set.",
      confirmLabel: n === 1 ? "Adicionar" : `Adicionar ${n}`,
      action: () => addCardsToWanted(missingNotWanted),
    });
  };

  const removeMissingFromWanted = () => {
    const n = missingInWanted.length;
    if (n === 0) return;
    setConfirm({
      title:
        n === 1
          ? "Remover 1 carta da busca?"
          : `Remover ${n} cartas da busca?`,
      message: "Remove só as faltantes deste set que estão na sua lista de busca.",
      confirmLabel: n === 1 ? "Remover" : `Remover ${n}`,
      danger: true,
      action: () => {
        for (const card of missingInWanted) {
          removeCardFromWanted(card.id);
        }
        setWantedHint(
          n === 1
            ? "1 carta removida da busca."
            : `${n} cartas removidas da busca.`,
        );
      },
    });
  };

  const addSelectedToWanted = () => {
    const cardsToAdd = gridCards.filter(
      (c) =>
        selectedIds.has(c.id) && !ownedIds.has(c.id) && !wantedIds.has(c.id),
    );
    if (cardsToAdd.length === 0) return;

    const run = () => {
      addCardsToWanted(cardsToAdd);
      setSelectedIds(new Set());
    };

    if (cardsToAdd.length < 10) {
      run();
      return;
    }

    setConfirm({
      title: `Adicionar ${cardsToAdd.length} cartas à busca?`,
      message: "As cartas selecionadas que você ainda não tem vão para a lista de busca.",
      confirmLabel: `Adicionar ${cardsToAdd.length}`,
      action: run,
    });
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
  const setName = setData?.name ?? setId;
  const catalogBackLink = setData?.serie?.id
    ? `/catalog?series=${setData.serie.id}`
    : "/catalog";

  return (
    <div className={`space-y-5 ${markMode ? "pb-40" : ""}`}>
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <BackButton to={catalogBackLink}>Coleções</BackButton>
          <div className="flex items-center gap-2">
            {!isLoading && !error && gridCards.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (markMode) exitMarkMode();
                  else setMarkMode(true);
                }}
                aria-pressed={markMode}
                className="ui-tool-btn"
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
              className="ui-tool-btn !w-11 !px-0"
            >
              <IconRefresh
                className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-3xl">
            {setName}
          </h1>
          {!isLoading && !error && setData?.contentLanguage !== "pt" ? (
            <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
              {setData?.contentLanguage === "en"
                ? "Esta expansão ainda não tem cartas em português na TCGdex; o conteúdo disponível está em inglês."
                : "Esta expansão tem tradução parcial; as cartas ausentes em português foram complementadas em inglês."}
            </p>
          ) : null}
          {!isLoading && !error && (setData?.englishImageCount ?? 0) > 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              {setData?.englishImageCount} imagem{setData?.englishImageCount === 1 ? "" : "s"} complementada{setData?.englishImageCount === 1 ? "" : "s"} pelo catálogo internacional.
            </p>
          ) : null}
          {!isLoading && !error && (setData?.pokemonTcgImageCount ?? 0) > 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              {setData?.pokemonTcgImageCount} imagem{setData?.pokemonTcgImageCount === 1 ? "" : "s"} complementada{setData?.pokemonTcgImageCount === 1 ? "" : "s"} pela Pokémon TCG API.
            </p>
          ) : null}
          {!isLoading && !error && (setData?.missingImageCount ?? 0) > 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              {setData?.missingImageCount} carta{setData?.missingImageCount === 1 ? " ainda está" : "s ainda estão"} sem imagem disponível na TCGdex.
            </p>
          ) : null}
          <ProgressFolio
            owned={owned}
            total={total > 0 ? total : undefined}
            isLoading={isLoading}
          />
          {!isLoading &&
          !error &&
          !markMode &&
          (missingNotWanted.length > 0 || missingInWanted.length > 0) ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              {missingNotWanted.length > 0 ? (
                <button
                  type="button"
                  onClick={addMissingToWanted}
                  className="ui-btn-accent min-h-11 w-full flex-1 px-4 text-sm disabled:opacity-40"
                >
                  Adicionar à busca ({missingNotWanted.length})
                </button>
              ) : null}
              {missingInWanted.length > 0 ? (
                <button
                  type="button"
                  onClick={removeMissingFromWanted}
                  className="min-h-11 w-full flex-1 rounded-xl border border-[var(--color-error)] px-4 text-sm font-bold text-[var(--color-error)]"
                >
                  Remover da busca ({missingInWanted.length})
                </button>
              ) : null}
            </div>
          ) : null}
          {wantedHint ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {wantedHint}{" "}
              <button
                type="button"
                onClick={() => navigate("/trades?tab=wanted")}
                className="font-semibold text-[var(--color-accent)] hover:underline"
              >
                Ver busca
              </button>
            </p>
          ) : null}
        </div>
      </header>

      {!isLoading && !error && gridCards.length > 0 ? (
        <SegmentTabs
          layoutId="catalog-set-filter-tab"
          aria-label="Filtrar cartas"
          value={filter}
          onChange={setFilter}
          className="sticky top-3 z-20 shadow-[0_14px_30px_-24px_rgba(0,0,0,0.5)]"
          options={filterOptions.map((opt) => {
            const count =
              opt.key === "all"
                ? gridCards.length
                : opt.key === "owned"
                  ? owned
                  : missingCount;
            const active = filter === opt.key;
            return {
              key: opt.key,
              label: opt.label,
              className:
                "flex flex-col items-center justify-center px-2 py-1.5 text-xs sm:flex-row sm:gap-1.5 sm:text-sm",
              trailing: (
                <span
                  className={`font-[family-name:var(--font-mono)] text-[10px] sm:text-xs ${
                    active
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {count}
                </span>
              ),
            };
          })}
        />
      ) : null}

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" role="status" aria-label="Carregando cartas">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="space-y-2">
              <div className="ui-skeleton aspect-[0.72]" />
              <div className="ui-skeleton h-4 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="ui-empty space-y-4" role="alert">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Não foi possível carregar este set</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Verifique sua conexão e tente novamente.</p>
          </div>
          <button type="button" className="ui-tool-btn" onClick={() => void refetch()}>
            Tentar novamente
          </button>
        </div>
      )}

      {!isLoading && !error && filteredCards.length === 0 ? (
        <p className="ui-empty text-sm">
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
          onCardLongPress={(id) => {
            if (markMode) {
              toggleSelected(id);
              return;
            }
            setMarkMode(true);
            setSelectedIds(new Set([id]));
          }}
        />
      ) : null}

      {markMode
        ? createPortal(
            <div
              role="toolbar"
              aria-label="Ações das cartas selecionadas"
              className="ui-glass-strong fixed inset-x-0 bottom-0 z-[55] border-t border-[var(--color-border)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:left-60"
            >
              <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 text-sm text-[var(--color-text-secondary)]">
                    {selectedCount === 0
                      ? "Toque nas cartas para selecionar."
                      : `${selectedCount} selecionada${selectedCount === 1 ? "" : "s"}`}
                  </p>
                  <button
                    type="button"
                    onClick={exitMarkMode}
                    className="ui-tool-btn min-h-10 shrink-0 px-3 text-sm"
                  >
                    Concluir
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={selectedMissingCount === 0}
                    onClick={addSelected}
                    className="ui-btn-accent col-span-2 min-h-12 w-full px-4 text-sm disabled:opacity-40"
                  >
                    Adicionar à coleção
                    {selectedMissingCount > 0
                      ? ` (${selectedMissingCount})`
                      : ""}
                  </button>
                  <button
                    type="button"
                    disabled={selectedMissingNotWanted === 0}
                    onClick={addSelectedToWanted}
                    className="ui-tool-btn min-h-12 w-full border-[var(--color-accent)] text-[var(--color-accent)] disabled:opacity-40"
                  >
                    Adicionar à busca
                    {selectedMissingNotWanted > 0
                      ? ` (${selectedMissingNotWanted})`
                      : ""}
                  </button>
                  <button
                    type="button"
                    disabled={selectedOwnedCount === 0}
                    onClick={removeSelected}
                    className="min-h-12 w-full rounded-xl border border-[var(--color-error)] px-4 text-sm font-bold text-[var(--color-error)] disabled:opacity-40"
                  >
                    Remover
                    {selectedOwnedCount > 0
                      ? ` (${selectedOwnedCount})`
                      : ""}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const action = confirm?.action;
          setConfirm(null);
          action?.();
        }}
      />
    </div>
  );
}
