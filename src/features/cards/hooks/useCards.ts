import { useQuery } from '@tanstack/react-query';
import tcgdex, { SUPPORTED_SETS } from '@/lib/tcgdex';

/**
 * Fetch all cards from a specific set
 */
export function useSetCards(setId: string = SUPPORTED_SETS.FOGO_FANTASMAGORICO) {
  return useQuery({
    queryKey: ['set-cards', setId],
    queryFn: async () => {
      const set = await tcgdex.set.get(setId);
      if (!set) {
        throw new Error(`Set ${setId} not found`);
      }
      return set;
    },
  });
}

/**
 * Fetch a single card by its full ID (e.g., 'me02-1')
 */
export function useCard(cardId: string) {
  return useQuery({
    queryKey: ['card', cardId],
    queryFn: async () => {
      const card = await tcgdex.card.get(cardId);
      if (!card) {
        throw new Error(`Card ${cardId} not found`);
      }
      return card;
    },
    enabled: !!cardId,
  });
}

/**
 * Fetch set metadata
 */
export function useSet(setId: string = SUPPORTED_SETS.FOGO_FANTASMAGORICO) {
  return useQuery({
    queryKey: ['set', setId],
    queryFn: async () => {
      const set = await tcgdex.set.get(setId);
      if (!set) {
        throw new Error(`Set ${setId} not found`);
      }
      return set;
    },
  });
}
