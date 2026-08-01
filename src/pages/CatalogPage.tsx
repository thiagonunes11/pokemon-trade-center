import { CollectionPickerCard, useCollections } from "@/features/sets";
import { COLLECTIONS } from "@/lib/collections";
import { useOwnedCountsBySet } from "@/hooks/useOwnedSetCount";
import { useNavigate } from "react-router-dom";

export function CatalogPage() {
  const navigate = useNavigate();
  const queries = useCollections();
  const ownedBySet = useOwnedCountsBySet();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Coleções
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Escolha uma expansão da série Megaevolução
        </p>
      </header>

      <div className="space-y-3">
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
