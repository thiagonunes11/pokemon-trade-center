import {
  scheduleDeleteCard,
  scheduleUpsertCard,
} from "@/features/collection/firestoreSync";
import { removeCardFromOffering } from "@/features/trades/tradeActions";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";

type NewCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
};

function findOwnedCard(cardId: string) {
  const uid = useAuthStore.getState().userId ?? null;
  return useCollectionStore
    .getState()
    .cards.find((c) => c.id === cardId && (c.ownerId ?? null) === uid);
}

function scheduleSavedCard(cardId: string) {
  const saved = findOwnedCard(cardId);
  if (!saved) return;
  scheduleUpsertCard({
    id: saved.id,
    name: saved.name,
    imageUrl: saved.imageUrl,
    setId: saved.setId,
    inShowcase: Boolean(saved.inShowcase),
    addedAt:
      saved.addedAt instanceof Date ? saved.addedAt : new Date(saved.addedAt),
  });
}

/** Adiciona localmente e agenda escrita no Firestore. */
export function addCardToCollection(card: NewCard) {
  const before = useCollectionStore.getState().hasCard(card.id);
  useCollectionStore.getState().addCard(card);
  if (before) return;
  scheduleSavedCard(card.id);
}

/** Remove localmente e agenda delete no Firestore. */
export function removeCardFromCollection(cardId: string) {
  const had = useCollectionStore.getState().hasCard(cardId);
  useCollectionStore.getState().removeCard(cardId);
  if (had) {
    scheduleDeleteCard(cardId);
    removeCardFromOffering(cardId);
  }
}

/** Marca/desmarca carta na vitrine compartilhável. */
export function setCardInShowcase(cardId: string, inShowcase: boolean) {
  if (!useCollectionStore.getState().hasCard(cardId)) return;
  useCollectionStore.getState().setCardShowcase(cardId, inShowcase);
  scheduleSavedCard(cardId);
}

export function toggleCardInShowcase(cardId: string) {
  const current = useCollectionStore.getState().isInShowcase(cardId);
  setCardInShowcase(cardId, !current);
}
