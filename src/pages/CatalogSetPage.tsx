import { CardGrid, useSetCards } from "@/features/cards";
import { BackButton } from "@/components/BackButton";
import { ProgressFolio } from "@/components/ProgressFolio";
import { getCollectionById, isSupportedSetId } from "@/lib/collections";
import { useOwnedSetCount } from "@/hooks/useOwnedSetCount";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useAuthStore } from "@/store/useAuthStore";
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
  const [filter, setFilter] = useState<SetFilter>("all");

  const ownedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of cards) {
      if ((c.ownerId ?? null) === (userId ?? null)) ids.add(c.id);
    }
    return ids;
  }, [cards, userId]);

  const gridCards = useMemo(
    () =>
      setData?.cards?.map((c) => ({
        id: c.id,
        name: c.name,
        localId: String(c.localId),
        image: c.image ?? null,
      })) ?? [],
    [setData?.cards],
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

  const missingCount = Math.max(
    (setData?.cardCount?.total ?? gridCards.length) - owned,
    0,
  );

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
    <div className="space-y-5">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <BackButton to="/catalog">Coleções</BackButton>
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

        <div className="space-y-3">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-3xl">
            {setName}
          </h1>
          <ProgressFolio
            owned={owned}
            total={total > 0 ? total : undefined}
            isLoading={isLoading}
          />
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
          binderMode
          onCardPress={(id) => navigate(`/card/${id}`)}
        />
      ) : null}
    </div>
  );
}
