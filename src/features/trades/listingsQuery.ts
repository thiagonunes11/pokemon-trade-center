import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firestore";
import type { TradeListKind } from "@/store/useTradeStore";

export type PublicListing = {
  id: string;
  ownerId: string;
  kind: TradeListKind;
  cardId: string;
  name: string;
  imageUrl: string | null;
  setId: string;
  displayName: string;
  updatedAt: Date;
};

const PAGE_SIZE = 30;

function parseListing(
  snap: QueryDocumentSnapshot<DocumentData>,
): PublicListing | null {
  const data = snap.data();
  if (
    typeof data.ownerId !== "string" ||
    (data.kind !== "offering" && data.kind !== "wanted") ||
    typeof data.cardId !== "string" ||
    typeof data.name !== "string" ||
    typeof data.setId !== "string" ||
    typeof data.displayName !== "string"
  ) {
    return null;
  }

  let updatedAt = new Date();
  const raw = data.updatedAt as Timestamp | undefined;
  if (raw && typeof raw.toDate === "function") {
    updatedAt = raw.toDate();
  }

  return {
    id: snap.id,
    ownerId: data.ownerId,
    kind: data.kind,
    cardId: data.cardId,
    name: data.name,
    imageUrl:
      data.imageUrl === null || typeof data.imageUrl === "string"
        ? data.imageUrl
        : null,
    setId: data.setId,
    displayName: data.displayName,
    updatedAt,
  };
}

export type ListingsPage = {
  items: PublicListing[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
};

/** Feed do mural (todos os anúncios de um kind). */
export async function fetchListingsPage(
  kind: TradeListKind,
  cursor: QueryDocumentSnapshot<DocumentData> | null = null,
): Promise<ListingsPage> {
  const col = collection(getFirestoreDb(), "listings");
  const composed = cursor
    ? query(
        col,
        where("kind", "==", kind),
        orderBy("updatedAt", "desc"),
        startAfter(cursor),
        limit(PAGE_SIZE),
      )
    : query(
        col,
        where("kind", "==", kind),
        orderBy("updatedAt", "desc"),
        limit(PAGE_SIZE),
      );

  const snap = await getDocs(composed);
  const items: PublicListing[] = [];
  for (const docSnap of snap.docs) {
    const parsed = parseListing(docSnap);
    if (parsed) items.push(parsed);
  }

  return {
    items,
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1]! : null,
    hasMore: snap.docs.length === PAGE_SIZE,
  };
}

/** Filtra listings cujo cardId está em `cardIds` (chunks de 30). */
export async function fetchListingsForCardIds(
  kind: TradeListKind,
  cardIds: string[],
): Promise<PublicListing[]> {
  if (cardIds.length === 0) return [];

  const unique = [...new Set(cardIds)].slice(0, 90);
  const col = collection(getFirestoreDb(), "listings");
  const results: PublicListing[] = [];

  for (let i = 0; i < unique.length; i += 30) {
    const chunk = unique.slice(i, i + 30);
    const q = query(
      col,
      where("kind", "==", kind),
      where("cardId", "in", chunk),
    );
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      const parsed = parseListing(docSnap);
      if (parsed) results.push(parsed);
    }
  }

  results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return results;
}
