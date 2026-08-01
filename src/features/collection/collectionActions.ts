import {
  scheduleDeleteCard,
  scheduleUpsertCard,
} from "@/features/collection/firestoreSync";
import { useCollectionStore } from "@/store/useCollectionStore";

type NewCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
};

/** Adiciona localmente e agenda escrita no Firestore. */
export function addCardToCollection(card: NewCard) {
  const before = useCollectionStore.getState().hasCard(card.id);
  useCollectionStore.getState().addCard(card);
  if (before) return;

  const saved = useCollectionStore
    .getState()
    .cards.find((c) => c.id === card.id);
  if (!saved) return;

  scheduleUpsertCard({
    id: saved.id,
    name: saved.name,
    imageUrl: saved.imageUrl,
    setId: saved.setId,
    addedAt:
      saved.addedAt instanceof Date ? saved.addedAt : new Date(saved.addedAt),
  });
}

/** Remove localmente e agenda delete no Firestore. */
export function removeCardFromCollection(cardId: string) {
  const had = useCollectionStore.getState().hasCard(cardId);
  useCollectionStore.getState().removeCard(cardId);
  if (had) {
    scheduleDeleteCard(cardId);
  }
}
