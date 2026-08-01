import { CollectionPickerCard, useCollections } from "@/features/sets";
import { COLLECTIONS } from "@/lib/collections";
import { useOwnedCountsBySet } from "@/hooks/useOwnedSetCount";
import { useNavigate } from "react-router-dom";

export function CatalogPage() {
  const navigate = useNavigate();
  const queries = useCollections();
  const ownedBySet = useOwnedCountsBySet();

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
    </div>
  );
}
