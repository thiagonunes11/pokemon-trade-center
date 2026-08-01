import {
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firestore";
import { useAuthStore } from "@/store/useAuthStore";
import type { TradeListKind } from "@/store/useTradeStore";

export type ListingCardInput = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
  updatedAt: Date;
};

export function listingDocId(
  uid: string,
  kind: TradeListKind,
  cardId: string,
) {
  return `${uid}_${kind}_${cardId}`;
}

function listingRef(uid: string, kind: TradeListKind, cardId: string) {
  return doc(getFirestoreDb(), "listings", listingDocId(uid, kind, cardId));
}

export async function upsertListing(
  uid: string,
  kind: TradeListKind,
  card: ListingCardInput,
  displayName: string,
): Promise<void> {
  await setDoc(
    listingRef(uid, kind, card.id),
    {
      ownerId: uid,
      kind,
      cardId: card.id,
      name: card.name,
      imageUrl: card.imageUrl,
      setId: card.setId,
      displayName: displayName.trim() || "Treinador",
      updatedAt: Timestamp.fromDate(
        card.updatedAt instanceof Date
          ? card.updatedAt
          : new Date(card.updatedAt),
      ),
    },
    { merge: true },
  );
}

export async function deleteListing(
  uid: string,
  kind: TradeListKind,
  cardId: string,
): Promise<void> {
  await deleteDoc(listingRef(uid, kind, cardId));
}

/** Reescreve o mural público a partir das listas locais do usuário. */
export async function backfillListingsFromStore(
  uid: string,
  offering: ListingCardInput[],
  wanted: ListingCardInput[],
): Promise<void> {
  const displayName =
    useAuthStore.getState().username?.trim() || "Treinador";
  const db = getFirestoreDb();
  const all = [
    ...offering.map((c) => ({ kind: "offering" as const, card: c })),
    ...wanted.map((c) => ({ kind: "wanted" as const, card: c })),
  ];

  // Firestore batch limit 500
  for (let i = 0; i < all.length; i += 400) {
    const chunk = all.slice(i, i + 400);
    const batch = writeBatch(db);
    for (const { kind, card } of chunk) {
      batch.set(
        listingRef(uid, kind, card.id),
        {
          ownerId: uid,
          kind,
          cardId: card.id,
          name: card.name,
          imageUrl: card.imageUrl,
          setId: card.setId,
          displayName,
          updatedAt: Timestamp.fromDate(
            card.updatedAt instanceof Date
              ? card.updatedAt
              : new Date(card.updatedAt),
          ),
        },
        { merge: true },
      );
    }
    await batch.commit();
  }
}
