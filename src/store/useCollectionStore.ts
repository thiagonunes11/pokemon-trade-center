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
  /** Carta escolhida para a vitrine compartilhável */
  inShowcase?: boolean;
}

interface CollectionState {
  cards: CollectionCard[];
  addCard: (card: Omit<CollectionCard, "addedAt" | "ownerId">) => void;
  removeCard: (cardId: string) => void;
  setCardShowcase: (cardId: string, inShowcase: boolean) => void;
  hasCard: (cardId: string) => boolean;
  isInShowcase: (cardId: string) => boolean;
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

function ownedMatch(
  card: CollectionCard,
  ownerId: string | null,
): boolean {
  return (card.ownerId ?? null) === ownerId;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard: (card) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        if (get().hasCard(card.id)) return;

        set((state) => ({
          cards: [
            ...state.cards,
            {
              ...card,
              ownerId,
              inShowcase: card.inShowcase ?? false,
              addedAt: new Date(),
            },
          ],
        }));
      },

      removeCard: (cardId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        set((state) => ({
          cards: state.cards.filter(
            (c) => !(c.id === cardId && ownedMatch(c, ownerId)),
          ),
        }));
      },

      setCardShowcase: (cardId, inShowcase) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === cardId && ownedMatch(c, ownerId)
              ? { ...c, inShowcase }
              : c,
          ),
        }));
      },

      hasCard: (cardId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().cards.some(
          (c) => c.id === cardId && ownedMatch(c, ownerId),
        );
      },

      isInShowcase: (cardId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().cards.some(
          (c) =>
            c.id === cardId &&
            ownedMatch(c, ownerId) &&
            Boolean(c.inShowcase),
        );
      },

      getCardCount: () => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().cards.filter((c) => ownedMatch(c, ownerId)).length;
      },

      getSetCardCount: (setId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().cards.filter(
          (c) => c.setId === setId && ownedMatch(c, ownerId),
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
              inShowcase: Boolean(card.inShowcase),
              addedAt: normalizeAddedAt(card.addedAt),
            });
          }
          for (const card of localOwned) {
            const existing = byId.get(card.id);
            if (!existing) {
              byId.set(card.id, {
                ...card,
                ownerId,
                inShowcase: Boolean(card.inShowcase),
                addedAt: normalizeAddedAt(card.addedAt),
              });
            } else if (card.inShowcase && !existing.inShowcase) {
              // Local showcase flag not yet on remote — keep until push
              byId.set(card.id, { ...existing, inShowcase: true });
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
