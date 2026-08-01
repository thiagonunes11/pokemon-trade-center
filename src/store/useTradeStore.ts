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

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      offering: [],
      wanted: [],

      addOffering: (card) => {
        const ownerId = useAuthStore.getState().userId ?? null;
        if (get().hasOffering(card.id)) return;
        set((s) => ({
          offering: [...s.offering, withOwner(card, ownerId)],
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

      replaceList: (ownerId, kind, cards) => {
        set((state) => {
          const key = kind === "offering" ? "offering" : "wanted";
          const others = state[key].filter(
            (c) => (c.ownerId ?? null) !== ownerId,
          );
          const normalized = cards.map((c) => ({
            ...c,
            ownerId,
            updatedAt: normalizeUpdatedAt(c.updatedAt),
          }));
          return { [key]: [...others, ...normalized] };
        });
      },
    }),
    {
      name: "pokemon-trade-lists-storage",
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
