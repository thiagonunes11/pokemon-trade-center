import { safeStorage } from "@/lib/safeStorage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";

export interface CollectionCard {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
  ownerId?: string | null;
  addedAt: Date;
}

interface CollectionState {
  cards: CollectionCard[];
  addCard: (card: Omit<CollectionCard, "addedAt" | "ownerId">) => void;
  removeCard: (cardId: string) => void;
  hasCard: (cardId: string) => boolean;
  getCardCount: () => number;
  getSetCardCount: (setId: string) => number;
  mergeRemoteCards: (ownerId: string, remote: CollectionCard[]) => void;
}

function normalizeAddedAt(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard: (card) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        if (ownerId && get().hasCard(card.id)) return;

        set((state) => ({
          cards: [
            ...state.cards,
            { ...card, ownerId, addedAt: new Date() },
          ],
        }));
      },

      removeCard: (cardId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        set((state) => ({
          cards: state.cards.filter(
            (c) => !(c.id === cardId && c.ownerId === ownerId),
          ),
        }));
      },

      hasCard: (cardId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().cards.some(
          (c) => c.id === cardId && c.ownerId === ownerId,
        );
      },

      getCardCount: () => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().cards.filter((c) => c.ownerId === ownerId).length;
      },

      getSetCardCount: (setId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().cards.filter(
          (c) => c.setId === setId && c.ownerId === ownerId,
        ).length;
      },

      mergeRemoteCards: (ownerId, remote) => {
        set((state) => {
          const others = state.cards.filter(
            (c) => (c.ownerId ?? null) !== ownerId,
          );
          const localOwned = state.cards.filter(
            (c) => (c.ownerId ?? null) === ownerId,
          );
          const byId = new Map<string, CollectionCard>();

          for (const card of remote) {
            byId.set(card.id, {
              ...card,
              ownerId,
              addedAt: normalizeAddedAt(card.addedAt),
            });
          }
          for (const card of localOwned) {
            if (!byId.has(card.id)) {
              byId.set(card.id, {
                ...card,
                ownerId,
                addedAt: normalizeAddedAt(card.addedAt),
              });
            }
          }

          return { cards: [...others, ...byId.values()] };
        });
      },
    }),
    {
      name: "pokemon-collection-storage",
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
