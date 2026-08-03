import { useQuery } from '@tanstack/react-query';
import { fetchCardWithFallback, fetchSetWithFallback } from '@/lib/tcgdex';

/**
 * Fetch all cards from a specific set
 */
export function useSetCards(setId: string) {
  return useQuery({
    queryKey: ['set-cards-v2', setId],
    queryFn: async () => {
      return fetchSetWithFallback(setId);
    },
    enabled: !!setId,
  });
}

/**
 * Fetch a single card by its full ID (e.g., 'me02-1')
 */
export function useCard(cardId: string) {
  return useQuery({
    queryKey: ['card-v2', cardId],
    queryFn: async () => {
      return fetchCardWithFallback(cardId);
    },
    enabled: !!cardId,
  });
}

/**
 * Fetch set metadata
 */
export function useSet(setId: string) {
  return useQuery({
    queryKey: ['set-v2', setId],
    queryFn: async () => {
      return fetchSetWithFallback(setId);
    },
  });
}
