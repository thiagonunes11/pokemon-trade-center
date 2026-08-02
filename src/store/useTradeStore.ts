import {
  normalizeOfferingTerms,
  type OfferingTerms,
  type WantCardRef,
} from "@/features/trades/offeringTerms";
import { safeStorage } from "@/lib/safeStorage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";

export type TradeListKind = "offering" | "wanted";

export interface TradeListCard {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
  ownerId?: string | null;
  priceBRL?: number | null;
  wantCards?: WantCardRef[];
  updatedAt: Date;
}

interface TradeState {
  offering: TradeListCard[];
  wanted: TradeListCard[];
  addOffering: (card: Omit<TradeListCard, "updatedAt" | "ownerId">) => void;
  removeOffering: (cardId: string) => void;
  addWanted: (card: Omit<TradeListCard, "updatedAt" | "ownerId">) => void;
  removeWanted: (cardId: string) => void;
  hasOffering: (cardId: string) => boolean;
  hasWanted: (cardId: string) => boolean;
  updateOfferingTerms: (cardId: string, terms: OfferingTerms) => void;
  replaceList: (
    ownerId: string,
    kind: TradeListKind,
    cards: TradeListCard[],
  ) => void;
}

function normalizeUpdatedAt(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function normalizeOfferingCard(card: TradeListCard): TradeListCard {
  const terms = normalizeOfferingTerms({
    priceBRL: card.priceBRL,
    wantCards: card.wantCards,
  });
  return {
    ...card,
    ...terms,
    updatedAt: normalizeUpdatedAt(card.updatedAt),
  };
}

function withOwner(
  card: Omit<TradeListCard, "updatedAt" | "ownerId">,
  ownerId: string | null,
): TradeListCard {
  return {
    ...card,
    ownerId,
    updatedAt: new Date(),
  };
}

function withOfferingOwner(
  card: Omit<TradeListCard, "updatedAt" | "ownerId">,
  ownerId: string | null,
): TradeListCard {
  return normalizeOfferingCard(withOwner(card, ownerId));
}

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      offering: [],
      wanted: [],

      addOffering: (card) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        if (get().hasOffering(card.id)) return;
        set((s) => ({
          offering: [...s.offering, withOfferingOwner(card, ownerId)],
        }));
      },

      removeOffering: (cardId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        set((s) => ({
          offering: s.offering.filter(
            (c) =>
              !(c.id === cardId && (c.ownerId ?? null) === ownerId),
          ),
        }));
      },

      addWanted: (card) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        if (get().hasWanted(card.id)) return;
        set((s) => ({
          wanted: [...s.wanted, withOwner(card, ownerId)],
        }));
      },

      removeWanted: (cardId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        set((s) => ({
          wanted: s.wanted.filter(
            (c) =>
              !(c.id === cardId && (c.ownerId ?? null) === ownerId),
          ),
        }));
      },

      hasOffering: (cardId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().offering.some(
          (c) => c.id === cardId && (c.ownerId ?? null) === ownerId,
        );
      },

      hasWanted: (cardId) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        return get().wanted.some(
          (c) => c.id === cardId && (c.ownerId ?? null) === ownerId,
        );
      },

      updateOfferingTerms: (cardId, terms) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        set((s) => ({
          offering: s.offering.map((c) =>
            c.id === cardId && (c.ownerId ?? null) === ownerId
              ? {
                  ...c,
                  priceBRL: terms.priceBRL,
                  wantCards: terms.wantCards,
                  updatedAt: new Date(),
                }
              : c,
          ),
        }));
      },

      replaceList: (ownerId, kind, cards) => {
        set((state) => {
          const key = kind === "offering" ? "offering" : "wanted";
          const others = state[key].filter(
            (c) => (c.ownerId ?? null) !== ownerId,
          );
          const normalized = cards.map((c) => {
            const base: TradeListCard = {
              ...c,
              ownerId,
              updatedAt: normalizeUpdatedAt(c.updatedAt),
            };
            return kind === "offering" ? normalizeOfferingCard(base) : base;
          });
          return { [key]: [...others, ...normalized] };
        });
      },
    }),
    {
      name: "pokemon-trade-lists-storage",
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.offering = state.offering.map(normalizeOfferingCard);
      },
    },
  ),
);
