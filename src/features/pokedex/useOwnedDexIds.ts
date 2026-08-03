import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { matchDexIdsByCardName } from "./matchDexIds";
import { fetchCardDexIds } from "./tcgdexDexIds";
import type { NationalSpecies } from "./types";

async function mapPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      await fn(items[index]!);
    }
  }
  const workers = Math.min(concurrency, items.length || 1);
  await Promise.all(Array.from({ length: workers }, () => worker()));
}

/**
 * Resolve espécies “tenho” a partir da coleção.
 * Lookup TCGdex com concorrência limitada; cache por `cardId`.
 */
export function useOwnedDexIds(species: NationalSpecies[] | undefined) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  const cards = useCollectionStore((s) => s.cards);

  const ownedCards = useMemo(
    () => cards.filter((c) => (c.ownerId ?? null) === (userId ?? null)),
    [cards, userId],
  );

  const cardIdsKey = useMemo(
    () =>
      ownedCards
        .map((c) => c.id)
        .slice()
        .sort()
        .join("|"),
    [ownedCards],
  );

  const speciesCount = species?.length ?? 0;

  const query = useQuery({
    queryKey: [
      "owned-dex-ids-v1",
      userId ?? "anon",
      cardIdsKey,
      speciesCount,
    ],
    enabled: ownedCards.length > 0,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const owned = new Set<number>();
      const snapshot = ownedCards;

      await mapPool(snapshot, 6, async (card) => {
        const cacheKey = ["card-dex-v1", card.id] as const;
        let resolved = queryClient.getQueryData<{
          dexIds: number[];
          cardName: string | null;
        }>(cacheKey);

        if (!resolved) {
          try {
            resolved = await fetchCardDexIds(card.id);
            queryClient.setQueryData(cacheKey, resolved);
          } catch {
            resolved = { dexIds: [], cardName: null };
          }
        }

        if (resolved.dexIds.length > 0) {
          resolved.dexIds.forEach((id) => owned.add(id));
          return;
        }

        const nameForMatch = resolved.cardName || card.name;
        if (nameForMatch && species?.length) {
          matchDexIdsByCardName(nameForMatch, species).forEach((id) =>
            owned.add(id),
          );
        }
      });

      return [...owned].sort((a, b) => a - b);
    },
  });

  const ownedDexIds = useMemo(
    () => new Set(query.data ?? []),
    [query.data],
  );

  return {
    ownedDexIds,
    isResolving: ownedCards.length > 0 && query.isFetching,
  };
}
