import { CardGrid, useSetCards } from "@/features/cards";
import { getCollectionById, isSupportedSetId } from "@/lib/collections";
import { formatCollectionProgress } from "@/lib/formatCollectionProgress";
import { useOwnedSetCount } from "@/hooks/useOwnedSetCount";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";

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

  const ownedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of cards) {
      if ((c.ownerId ?? null) === (userId ?? null)) ids.add(c.id);
    }
    return ids;
  }, [cards, userId]);

  if (!valid) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--color-error)]">Expansão não encontrada.</p>
        <Link to="/catalog" className="text-[var(--color-accent)] hover:underline">
          Voltar às coleções
        </Link>
      </div>
    );
  }

  const total =
    setData?.cardCount?.total ?? setData?.cards?.length ?? 0;
  const progress =
    total > 0 ? formatCollectionProgress(owned, total) : "—";

  const gridCards =
    setData?.cards?.map((c) => ({
      id: c.id,
      name: c.name,
      localId: String(c.localId),
      image: c.image ?? null,
    })) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/catalog"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            ← Coleções
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-[var(--color-text)]">
            {collection?.name ?? setId}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {progress}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-50"
        >
          {isFetching ? "Atualizando…" : "Atualizar"}
        </button>
      </header>

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

      {!isLoading && !error && (
        <CardGrid
          cards={gridCards}
          ownedIds={ownedIds}
          onCardPress={(id) => navigate(`/card/${id}`)}
        />
      )}
    </div>
  );
}
