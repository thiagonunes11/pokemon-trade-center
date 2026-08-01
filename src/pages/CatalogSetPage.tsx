import { CardGrid, useSetCards } from "@/features/cards";
import { ShareSetButton } from "@/features/share";
import { ProgressFolio } from "@/components/ProgressFolio";
import { getCollectionById, isSupportedSetId } from "@/lib/collections";
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
  const setName = collection?.name ?? setId;

  const gridCards =
    setData?.cards?.map((c) => ({
      id: c.id,
      name: c.name,
      localId: String(c.localId),
      image: c.image ?? null,
    })) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <Link
            to="/catalog"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            ← Coleções
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-text)]">
            {setName}
          </h1>
          <ProgressFolio
            owned={owned}
            total={total > 0 ? total : undefined}
            isLoading={isLoading}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <ShareSetButton
            setId={setId}
            setName={setName}
            cards={gridCards}
            ownedIds={ownedIds}
            owned={owned}
            total={total}
            disabled={isLoading || Boolean(error)}
          />
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-sm border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-50"
          >
            {isFetching ? "Atualizando…" : "Atualizar"}
          </button>
        </div>
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
          binderMode
          onCardPress={(id) => navigate(`/card/${id}`)}
        />
      )}
    </div>
  );
}
