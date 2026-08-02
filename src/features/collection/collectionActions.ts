import {
  scheduleDeleteCard,
  scheduleUpsertCard,
} from "@/features/collection/firestoreSync";
import {
  deletePublicShowcaseCard,
  syncPublicShowcaseCard,
} from "@/features/profile/showcaseMirror";
import {
  removeCardFromOffering,
  removeCardFromWanted,
} from "@/features/trades/tradeActions";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useTradeStore } from "@/store/useTradeStore";

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

function syncShowcaseMirror(cardId: string, inShowcase: boolean) {
  const uid = useAuthStore.getState().userId;
  const saved = findOwnedCard(cardId);
  if (!uid || !saved) return;
  void syncPublicShowcaseCard(
    uid,
    {
      id: saved.id,
      name: saved.name,
      imageUrl: saved.imageUrl,
      setId: saved.setId,
    },
    inShowcase,
  ).catch((err) => console.warn("[ShowcaseMirror]", err));
}

/** Adiciona localmente e agenda escrita no Firestore.
 *  Carta nova que estava em Procurando sai da busca automaticamente. */
export function addCardToCollection(card: NewCard): {
  added: boolean;
  removedFromWanted: boolean;
} {
  const before = useCollectionStore.getState().hasCard(card.id);
  useCollectionStore.getState().addCard(card);
  if (before) {
    return { added: false, removedFromWanted: false };
  }
  scheduleSavedCard(card.id);

  const wasWanted = useTradeStore.getState().hasWanted(card.id);
  if (wasWanted) {
    removeCardFromWanted(card.id);
  }
  return { added: true, removedFromWanted: wasWanted };
}

/** Remove localmente e agenda delete no Firestore. */
export function removeCardFromCollection(cardId: string) {
  const uid = useAuthStore.getState().userId;
  const had = useCollectionStore.getState().hasCard(cardId);
  useCollectionStore.getState().removeCard(cardId);
  if (had) {
    scheduleDeleteCard(cardId);
    removeCardFromOffering(cardId);
    if (uid) {
      void deletePublicShowcaseCard(uid, cardId).catch((err) =>
        console.warn("[ShowcaseMirror] delete", err),
      );
    }
  }
}

/** Marca/desmarca carta na vitrine compartilhável. */
export function setCardInShowcase(cardId: string, inShowcase: boolean) {
  if (!useCollectionStore.getState().hasCard(cardId)) return;
  useCollectionStore.getState().setCardShowcase(cardId, inShowcase);
  scheduleSavedCard(cardId);
  syncShowcaseMirror(cardId, inShowcase);
}

export function toggleCardInShowcase(cardId: string) {
  const current = useCollectionStore.getState().isInShowcase(cardId);
  setCardInShowcase(cardId, !current);
}
