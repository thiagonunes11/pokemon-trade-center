import { useMemo } from "react";

import { useCollectionStore } from "@/store/useCollectionStore";

/** Contagem de cartas que o usuário possui em um set específico */
export function useOwnedSetCount(setId: string | null | undefined): number {
  return useCollectionStore(
    useMemo(
      () => (state) =>
        setId
          ? state.cards.filter((card) => card.setId === setId).length
          : 0,
      [setId],
    ),
  );
}

/** Mapa setId → quantidade na coleção local (para listas de vários sets) */
export function useOwnedCountsBySet(): Record<string, number> {
  const cards = useCollectionStore((state) => state.cards);

  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of cards) {
      counts[card.setId] = (counts[card.setId] ?? 0) + 1;
    }
    return counts;
  }, [cards]);
}
