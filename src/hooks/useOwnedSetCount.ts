import { useMemo } from "react";

import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";

function countOwnedForSet(
  cards: { setId: string; ownerId?: string | null }[],
  setId: string,
  userId: string | null | undefined,
): number {
  return cards.filter(
    (card) => card.setId === setId && (card.ownerId ?? null) === (userId ?? null),
  ).length;
}

/** Contagem de cartas que o usuário logado possui em um set específico */
export function useOwnedSetCount(setId: string | null | undefined): number {
  const userId = useAuthStore((state) => state.userId);
  const cards = useCollectionStore((state) => state.cards);

  return useMemo(
    () => (setId ? countOwnedForSet(cards, setId, userId) : 0),
    [cards, setId, userId],
  );
}

/** Mapa setId → quantidade na coleção do usuário logado */
export function useOwnedCountsBySet(): Record<string, number> {
  const userId = useAuthStore((state) => state.userId);
  const cards = useCollectionStore((state) => state.cards);

  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of cards) {
      if ((card.ownerId ?? null) !== (userId ?? null)) continue;
      counts[card.setId] = (counts[card.setId] ?? 0) + 1;
    }
    return counts;
  }, [cards, userId]);
}
