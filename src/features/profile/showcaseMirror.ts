import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firestore";

export type ShowcaseMirrorCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
};

function showcaseCardRef(uid: string, cardId: string) {
  return doc(getFirestoreDb(), "publicShowcases", uid, "cards", cardId);
}

function showcaseColRef(uid: string) {
  return collection(getFirestoreDb(), "publicShowcases", uid, "cards");
}

/** Espelha (ou remove) uma carta na vitrine pública. */
export async function syncPublicShowcaseCard(
  uid: string,
  card: ShowcaseMirrorCard,
  inShowcase: boolean,
): Promise<void> {
  const ref = showcaseCardRef(uid, card.id);
  if (!inShowcase) {
    await deleteDoc(ref);
    return;
  }
  await setDoc(
    ref,
    {
      id: card.id,
      name: card.name,
      imageUrl: card.imageUrl,
      setId: card.setId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deletePublicShowcaseCard(
  uid: string,
  cardId: string,
): Promise<void> {
  await deleteDoc(showcaseCardRef(uid, cardId));
}

/** Reescreve a vitrine pública a partir das cartas locais com ★. */
export async function backfillPublicShowcase(
  uid: string,
  cards: ShowcaseMirrorCard[],
): Promise<void> {
  const snap = await getDocs(showcaseColRef(uid));
  const remoteIds = new Set(snap.docs.map((d) => d.id));
  const nextIds = new Set(cards.map((c) => c.id));

  await Promise.all([
    ...cards.map((card) => syncPublicShowcaseCard(uid, card, true)),
    ...[...remoteIds]
      .filter((id) => !nextIds.has(id))
      .map((id) => deletePublicShowcaseCard(uid, id)),
  ]);
}

export async function fetchPublicShowcaseCards(
  uid: string,
): Promise<ShowcaseMirrorCard[]> {
  const snap = await getDocs(showcaseColRef(uid));
  const cards: ShowcaseMirrorCard[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    if (typeof data.id !== "string" || typeof data.name !== "string") continue;
    cards.push({
      id: data.id,
      name: data.name,
      imageUrl:
        data.imageUrl === null || typeof data.imageUrl === "string"
          ? data.imageUrl
          : null,
      setId: typeof data.setId === "string" ? data.setId : "",
    });
  }
  cards.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return cards;
}
