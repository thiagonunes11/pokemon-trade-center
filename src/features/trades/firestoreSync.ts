import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  backfillListingsFromStore,
  deleteListing,
  upsertListing,
} from "@/features/trades/listingsSync";
import {
  hasValidOfferingTerms,
  normalizeOfferingTerms,
  type OfferingTerms,
} from "@/features/trades/offeringTerms";
import { getFirestoreDb } from "@/lib/firestore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useTradeStore,
  type TradeListCard,
  type TradeListKind,
} from "@/store/useTradeStore";

const WRITE_DEBOUNCE_MS = 800;

type PendingUpsert = {
  kind: TradeListKind;
  card: {
    id: string;
    name: string;
    imageUrl: string | null;
    setId: string;
    priceBRL?: OfferingTerms["priceBRL"];
    wantCards?: OfferingTerms["wantCards"];
    updatedAt: Date;
  };
};

const pendingUpserts = new Map<string, PendingUpsert>();
const pendingDeletes = new Map<string, { kind: TradeListKind; cardId: string }>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let activeUid: string | null = null;
let pullInFlight: Promise<void> | null = null;

function pendingKey(kind: TradeListKind, cardId: string) {
  return `${kind}:${cardId}`;
}

function listCollectionRef(uid: string, kind: TradeListKind) {
  return collection(getFirestoreDb(), "trades", uid, kind);
}

function listDocRef(uid: string, kind: TradeListKind, cardId: string) {
  return doc(getFirestoreDb(), "trades", uid, kind, cardId);
}

function displayNameForListings() {
  return useAuthStore.getState().username?.trim() || "Treinador";
}

function toFirestorePayload(
  kind: TradeListKind,
  card: PendingUpsert["card"],
) {
  const payload = {
    id: card.id,
    name: card.name,
    imageUrl: card.imageUrl,
    setId: card.setId,
    updatedAt: Timestamp.fromDate(
      card.updatedAt instanceof Date
        ? card.updatedAt
        : new Date(card.updatedAt),
    ),
  };
  if (kind !== "offering") return payload;
  return {
    ...payload,
    ...normalizeOfferingTerms(card),
  };
}

function parseRemoteCard(
  data: Record<string, unknown>,
  ownerId: string,
  kind: TradeListKind,
): TradeListCard | null {
  if (
    typeof data.id !== "string" ||
    typeof data.name !== "string" ||
    typeof data.setId !== "string"
  ) {
    return null;
  }

  let updatedAt = new Date();
  const raw = data.updatedAt;
  if (raw instanceof Timestamp) {
    updatedAt = raw.toDate();
  } else if (
    raw &&
    typeof raw === "object" &&
    "seconds" in raw &&
    typeof (raw as { seconds: unknown }).seconds === "number"
  ) {
    updatedAt = new Date((raw as { seconds: number }).seconds * 1000);
  } else if (typeof raw === "string" || typeof raw === "number") {
    updatedAt = new Date(raw);
  }

  const card: TradeListCard = {
    id: data.id,
    name: data.name,
    imageUrl:
      data.imageUrl === null || typeof data.imageUrl === "string"
        ? (data.imageUrl as string | null)
        : null,
    setId: data.setId,
    ownerId,
    updatedAt,
  };
  if (kind === "offering") {
    Object.assign(card, normalizeOfferingTerms(data));
  }
  return card;
}

async function flushPendingWrites(): Promise<void> {
  const uid = activeUid;
  if (!uid) {
    pendingUpserts.clear();
    pendingDeletes.clear();
    return;
  }

  const upserts = [...pendingUpserts.values()];
  const deletes = [...pendingDeletes.values()];
  pendingUpserts.clear();
  pendingDeletes.clear();
  const displayName = displayNameForListings();

  await Promise.all([
    ...upserts.map(async ({ kind, card }) => {
      try {
        await setDoc(
          listDocRef(uid, kind, card.id),
          toFirestorePayload(kind, card),
          { merge: true },
        );
        await upsertListing(uid, kind, card, displayName);
      } catch (error) {
        console.warn("[TradeSync] Falha ao enviar:", kind, card.id, error);
        pendingUpserts.set(pendingKey(kind, card.id), { kind, card });
      }
    }),
    ...deletes.map(async ({ kind, cardId }) => {
      try {
        await deleteDoc(listDocRef(uid, kind, cardId));
        await deleteListing(uid, kind, cardId);
      } catch (error) {
        console.warn("[TradeSync] Falha ao remover:", kind, cardId, error);
        pendingDeletes.set(pendingKey(kind, cardId), { kind, cardId });
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

export function setTradeSyncUser(uid: string | null) {
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

export function scheduleUpsertTradeCard(
  kind: TradeListKind,
  card: PendingUpsert["card"],
) {
  if (!activeUid) return;
  if (
    kind === "offering" &&
    !hasValidOfferingTerms(normalizeOfferingTerms(card))
  ) {
    console.warn("[TradeSync] Oferta sem preço ou cartas desejadas:", card.id);
    return;
  }
  const key = pendingKey(kind, card.id);
  pendingDeletes.delete(key);
  pendingUpserts.set(key, { kind, card });
  scheduleFlush();
}

export function scheduleDeleteTradeCard(kind: TradeListKind, cardId: string) {
  if (!activeUid) return;
  const key = pendingKey(kind, cardId);
  pendingUpserts.delete(key);
  pendingDeletes.set(key, { kind, cardId });
  scheduleFlush();
}

async function pullKind(uid: string, kind: TradeListKind): Promise<void> {
  const snapshot = await getDocs(listCollectionRef(uid, kind));
  const remote: TradeListCard[] = [];
  for (const docSnap of snapshot.docs) {
    const parsed = parseRemoteCard(docSnap.data(), uid, kind);
    if (parsed) remote.push(parsed);
  }

  const store = useTradeStore.getState();
  const localList = kind === "offering" ? store.offering : store.wanted;
  const localOwned = localList.filter((c) => (c.ownerId ?? null) === uid);

  store.replaceList(uid, kind, remote);

  const localOnly = localOwned.filter(
    (c) => !remote.some((r) => r.id === c.id),
  );
  for (const card of localOnly) {
    scheduleUpsertTradeCard(kind, {
      id: card.id,
      name: card.name,
      imageUrl: card.imageUrl,
      setId: card.setId,
      ...(kind === "offering"
        ? normalizeOfferingTerms({
            priceBRL: card.priceBRL,
            wantCards: card.wantCards,
          })
        : {}),
      updatedAt:
        card.updatedAt instanceof Date
          ? card.updatedAt
          : new Date(card.updatedAt),
    });
  }
}

function toListingInput(card: TradeListCard): {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
  priceBRL: number | null;
  wantCards: OfferingTerms["wantCards"];
  updatedAt: Date;
} {
  return {
    id: card.id,
    name: card.name,
    imageUrl: card.imageUrl,
    setId: card.setId,
    ...normalizeOfferingTerms({
      priceBRL: card.priceBRL,
      wantCards: card.wantCards,
    }),
    updatedAt:
      card.updatedAt instanceof Date
        ? card.updatedAt
        : new Date(card.updatedAt),
  };
}

export async function pullAndMergeTrades(uid: string): Promise<void> {
  if (pullInFlight) return pullInFlight;

  pullInFlight = (async () => {
    setTradeSyncUser(uid);
    await pullKind(uid, "offering");
    await pullKind(uid, "wanted");

    const store = useTradeStore.getState();
    const offering = store.offering
      .filter((c) => (c.ownerId ?? null) === uid)
      .map(toListingInput);
    const wanted = store.wanted
      .filter((c) => (c.ownerId ?? null) === uid)
      .map(toListingInput);
    try {
      await backfillListingsFromStore(uid, offering, wanted);
    } catch (error) {
      console.warn("[TradeSync] Falha ao espelhar mural:", error);
    }
  })()
    .catch((error) => {
      console.warn("[TradeSync] Falha ao puxar listas:", error);
    })
    .finally(() => {
      pullInFlight = null;
    });

  return pullInFlight;
}
