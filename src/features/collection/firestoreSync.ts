import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firestore";
import {
  useCollectionStore,
  type CollectionCard,
} from "@/store/useCollectionStore";

const WRITE_DEBOUNCE_MS = 800;

type PendingUpsert = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
  addedAt: Date;
  inShowcase?: boolean;
};

const pendingUpserts = new Map<string, PendingUpsert>();
const pendingDeletes = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let activeUid: string | null = null;
let pullInFlight: Promise<void> | null = null;

function cardsCollectionRef(uid: string) {
  return collection(getFirestoreDb(), "collections", uid, "cards");
}

function cardDocRef(uid: string, cardId: string) {
  return doc(getFirestoreDb(), "collections", uid, "cards", cardId);
}

function toFirestorePayload(card: PendingUpsert) {
  return {
    id: card.id,
    name: card.name,
    imageUrl: card.imageUrl,
    setId: card.setId,
    inShowcase: Boolean(card.inShowcase),
    addedAt: Timestamp.fromDate(
      card.addedAt instanceof Date ? card.addedAt : new Date(card.addedAt),
    ),
  };
}

function parseRemoteCard(
  data: Record<string, unknown>,
  ownerId: string,
): CollectionCard | null {
  if (
    typeof data.id !== "string" ||
    typeof data.name !== "string" ||
    typeof data.setId !== "string"
  ) {
    return null;
  }

  let addedAt = new Date();
  const rawAdded = data.addedAt;
  if (rawAdded instanceof Timestamp) {
    addedAt = rawAdded.toDate();
  } else if (
    rawAdded &&
    typeof rawAdded === "object" &&
    "seconds" in rawAdded &&
    typeof (rawAdded as { seconds: unknown }).seconds === "number"
  ) {
    addedAt = new Date((rawAdded as { seconds: number }).seconds * 1000);
  } else if (typeof rawAdded === "string" || typeof rawAdded === "number") {
    addedAt = new Date(rawAdded);
  }

  return {
    id: data.id,
    name: data.name,
    imageUrl:
      data.imageUrl === null || typeof data.imageUrl === "string"
        ? (data.imageUrl as string | null)
        : null,
    setId: data.setId,
    ownerId,
    inShowcase: data.inShowcase === true,
    addedAt,
  };
}

async function flushPendingWrites(): Promise<void> {
  const uid = activeUid;
  if (!uid) {
    pendingUpserts.clear();
    pendingDeletes.clear();
    return;
  }

  const upserts = [...pendingUpserts.values()];
  const deletes = [...pendingDeletes];
  pendingUpserts.clear();
  pendingDeletes.clear();

  await Promise.all([
    ...upserts.map(async (card) => {
      try {
        await setDoc(cardDocRef(uid, card.id), toFirestorePayload(card), {
          merge: true,
        });
      } catch (error) {
        console.warn("[CollectionSync] Falha ao enviar carta:", card.id, error);
        pendingUpserts.set(card.id, card);
      }
    }),
    ...deletes.map(async (cardId) => {
      try {
        await deleteDoc(cardDocRef(uid, cardId));
      } catch (error) {
        console.warn("[CollectionSync] Falha ao remover carta:", cardId, error);
        pendingDeletes.add(cardId);
      }
    }),
  ]);

  if (pendingUpserts.size > 0 || pendingDeletes.size > 0) {
    scheduleFlush();
  }
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPendingWrites();
  }, WRITE_DEBOUNCE_MS);
}

export function setCollectionSyncUser(uid: string | null) {
  activeUid = uid;
  if (!uid) {
    pendingUpserts.clear();
    pendingDeletes.clear();
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  }
}

export function scheduleUpsertCard(card: PendingUpsert) {
  if (!activeUid) return;
  pendingDeletes.delete(card.id);
  pendingUpserts.set(card.id, card);
  scheduleFlush();
}

export function scheduleDeleteCard(cardId: string) {
  if (!activeUid) return;
  pendingUpserts.delete(cardId);
  pendingDeletes.add(cardId);
  scheduleFlush();
}

/** Lê `collections/{uid}/cards`, mescla no Zustand e sobe cartas só locais. */
export async function pullAndMergeCollection(uid: string): Promise<void> {
  if (pullInFlight) return pullInFlight;

  pullInFlight = (async () => {
    setCollectionSyncUser(uid);

    const snapshot = await getDocs(cardsCollectionRef(uid));
    const remoteCards: CollectionCard[] = [];

    for (const docSnap of snapshot.docs) {
      const parsed = parseRemoteCard(docSnap.data(), uid);
      if (parsed) remoteCards.push(parsed);
    }

    useCollectionStore.getState().mergeRemoteCards(uid, remoteCards);

    const localOnly = useCollectionStore
      .getState()
      .cards.filter(
        (c) =>
          (c.ownerId ?? null) === uid &&
          !remoteCards.some((r) => r.id === c.id),
      );

    for (const card of localOnly) {
      scheduleUpsertCard({
        id: card.id,
        name: card.name,
        imageUrl: card.imageUrl,
        setId: card.setId,
        inShowcase: Boolean(card.inShowcase),
        addedAt:
          card.addedAt instanceof Date ? card.addedAt : new Date(card.addedAt),
      });
    }
  })()
    .catch((error) => {
      console.warn("[CollectionSync] Falha ao puxar coleção:", error);
    })
    .finally(() => {
      pullInFlight = null;
    });

  return pullInFlight;
}
