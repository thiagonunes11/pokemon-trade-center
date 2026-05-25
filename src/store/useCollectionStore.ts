import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/safeStorage';

interface CollectionCard {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
  addedAt: Date;
}

interface CollectionState {
  cards: CollectionCard[];
  addCard: (card: Omit<CollectionCard, 'addedAt'>) => void;
  removeCard: (cardId: string) => void;
  hasCard: (cardId: string) => boolean;
  getCardCount: () => number;
  getSetCardCount: (setId: string) => number;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard: (card) =>
        set((state) => ({
          cards: [...state.cards, { ...card, addedAt: new Date() }],
        })),

      removeCard: (cardId) =>
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== cardId),
        })),

      hasCard: (cardId) => get().cards.some((c) => c.id === cardId),

      getCardCount: () => get().cards.length,

      getSetCardCount: (setId) =>
        get().cards.filter((c) => c.setId === setId).length,
    }),
    {
      name: 'pokemon-collection-storage',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
