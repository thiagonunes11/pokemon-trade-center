import { create } from 'zustand';

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
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
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
}));
