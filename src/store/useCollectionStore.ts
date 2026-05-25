import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/safeStorage';
import { useAuthStore } from './useAuthStore';

interface CollectionCard {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
  ownerId?: string | null;
  addedAt: Date;
}

interface CollectionState {
  cards: CollectionCard[];
  addCard: (card: Omit<CollectionCard, 'addedAt' | 'ownerId'>) => void;
  removeCard: (cardId: string) => void;
  hasCard: (cardId: string) => boolean;
  getCardCount: () => number;
  getSetCardCount: (setId: string) => number;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard: (card) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        set((state) => ({
          cards: [...state.cards, { ...card, ownerId, addedAt: new Date() }],
        }));
      },

      removeCard: (cardId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        set((state) => ({
          cards: state.cards.filter((c) => !(c.id === cardId && c.ownerId === ownerId)),
        }));
      },

      hasCard: (cardId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().cards.some((c) => c.id === cardId && c.ownerId === ownerId);
      },

      getCardCount: () => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().cards.filter((c) => c.ownerId === ownerId).length;
      },

      getSetCardCount: (setId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().cards.filter((c) => c.setId === setId && c.ownerId === ownerId).length;
      },
    }),
    {
      name: 'pokemon-collection-storage',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
