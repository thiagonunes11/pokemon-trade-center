import {
  scheduleDeleteTradeCard,
  scheduleUpsertTradeCard,
} from "@/features/trades/firestoreSync";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTradeStore } from "@/store/useTradeStore";

type TradeCardInput = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
};

function scheduleSaved(kind: "offering" | "wanted", cardId: string) {
  const uid = useAuthStore.getState().userId ?? null;
  const list =
    kind === "offering"
      ? useTradeStore.getState().offering
      : useTradeStore.getState().wanted;
  const saved = list.find(
    (c) => c.id === cardId && (c.ownerId ?? null) === uid,
  );
  if (!saved) return;
  scheduleUpsertTradeCard(kind, {
    id: saved.id,
    name: saved.name,
    imageUrl: saved.imageUrl,
    setId: saved.setId,
    updatedAt:
      saved.updatedAt instanceof Date
        ? saved.updatedAt
        : new Date(saved.updatedAt),
  });
}

/** Anuncia carta da coleção para troca. */
export function addCardToOffering(card: TradeCardInput) {
  const uid = useAuthStore.getState().userId ?? null;
  const owned = useCollectionStore
    .getState()
    .cards.some(
      (c) => c.id === card.id && (c.ownerId ?? null) === uid,
    );
  if (!owned) {
    console.warn("[Trades] Só é possível anunciar cartas da coleção.");
    return;
  }

  const before = useTradeStore.getState().hasOffering(card.id);
  useTradeStore.getState().addOffering(card);
  if (!before) scheduleSaved("offering", card.id);
}

export function removeCardFromOffering(cardId: string) {
  const had = useTradeStore.getState().hasOffering(cardId);
  useTradeStore.getState().removeOffering(cardId);
  if (had) scheduleDeleteTradeCard("offering", cardId);
}

/** Marca carta do catálogo como procurada. */
export function addCardToWanted(card: TradeCardInput) {
  const before = useTradeStore.getState().hasWanted(card.id);
  useTradeStore.getState().addWanted(card);
  if (!before) scheduleSaved("wanted", card.id);
}

export function removeCardFromWanted(cardId: string) {
  const had = useTradeStore.getState().hasWanted(cardId);
  useTradeStore.getState().removeWanted(cardId);
  if (had) scheduleDeleteTradeCard("wanted", cardId);
}
