import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firestore";

export function threadIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

export type ChatThread = {
  id: string;
  participantIds: string[];
  peerId?: string;
  updatedAt: Date;
  lastMessagePreview: string | null;
  lastSenderId: string | null;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
};

function parseDate(raw: unknown): Date {
  if (raw && typeof raw === "object" && "toDate" in raw) {
    return (raw as Timestamp).toDate();
  }
  return new Date();
}

function inboxRef(uid: string, threadId: string) {
  return doc(getFirestoreDb(), "userThreads", uid, "items", threadId);
}

async function upsertInboxItem(input: {
  inboxUid: string;
  threadId: string;
  peerId: string;
  participantIds: string[];
  lastMessagePreview?: string | null;
  lastSenderId?: string | null;
  /** Se false, não envia preview/null (evita apagar preview existente no merge). */
  touchPreview?: boolean;
}): Promise<void> {
  const payload: Record<string, unknown> = {
    threadId: input.threadId,
    peerId: input.peerId,
    participantIds: input.participantIds,
    updatedAt: serverTimestamp(),
  };
  if (input.touchPreview) {
    payload.lastMessagePreview = input.lastMessagePreview ?? null;
    payload.lastSenderId = input.lastSenderId ?? null;
  }
  await setDoc(inboxRef(input.inboxUid, input.threadId), payload, {
    merge: true,
  });
}

export async function ensureThread(
  myUid: string,
  peerUid: string,
): Promise<string> {
  const id = threadIdFor(myUid, peerUid);
  const participantIds = [myUid, peerUid].sort();
  const db = getFirestoreDb();
  const threadRef = doc(db, "threads", id);

  await setDoc(
    threadRef,
    {
      participantIds,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  const threadSnap = await getDoc(threadRef);
  const threadData = threadSnap.data();
  const existingPreview =
    typeof threadData?.lastMessagePreview === "string"
      ? threadData.lastMessagePreview
      : null;
  const existingSender =
    typeof threadData?.lastSenderId === "string"
      ? threadData.lastSenderId
      : null;

  await Promise.all([
    upsertInboxItem({
      inboxUid: myUid,
      threadId: id,
      peerId: peerUid,
      participantIds,
      ...(existingPreview
        ? {
            touchPreview: true,
            lastMessagePreview: existingPreview,
            lastSenderId: existingSender,
          }
        : { touchPreview: false }),
    }),
    upsertInboxItem({
      inboxUid: peerUid,
      threadId: id,
      peerId: myUid,
      participantIds,
      ...(existingPreview
        ? {
            touchPreview: true,
            lastMessagePreview: existingPreview,
            lastSenderId: existingSender,
          }
        : { touchPreview: false }),
    }),
  ]);

  return id;
}

export async function sendTextMessage(
  threadId: string,
  senderId: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (trimmed.length > 1000) {
    throw new Error("Mensagem muito longa");
  }

  const db = getFirestoreDb();
  const threadSnap = await getDoc(doc(db, "threads", threadId));
  if (!threadSnap.exists()) {
    throw new Error("Conversa não encontrada");
  }
  const participantIds = Array.isArray(threadSnap.data().participantIds)
    ? (threadSnap.data().participantIds as string[])
    : [];
  if (!participantIds.includes(senderId) || participantIds.length !== 2) {
    throw new Error("Participantes inválidos");
  }
  const peerId = participantIds.find((id) => id !== senderId);
  if (!peerId) throw new Error("Peer não encontrado");

  const preview = trimmed.slice(0, 200);

  await addDoc(collection(db, "threads", threadId, "messages"), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "threads", threadId), {
    updatedAt: serverTimestamp(),
    lastMessagePreview: preview,
    lastSenderId: senderId,
  });

  await Promise.all([
    upsertInboxItem({
      inboxUid: senderId,
      threadId,
      peerId,
      participantIds,
      touchPreview: true,
      lastMessagePreview: preview,
      lastSenderId: senderId,
    }),
    upsertInboxItem({
      inboxUid: peerId,
      threadId,
      peerId: senderId,
      participantIds,
      touchPreview: true,
      lastMessagePreview: preview,
      lastSenderId: senderId,
    }),
  ]);
}

export function subscribeToMessages(
  threadId: string,
  onData: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirestoreDb(), "threads", threadId, "messages"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      const messages: ChatMessage[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          senderId: typeof data.senderId === "string" ? data.senderId : "",
          text: typeof data.text === "string" ? data.text : "",
          createdAt: parseDate(data.createdAt),
        };
      });
      onData(messages);
    },
    (err) => onError?.(err),
  );
}

/** Inbox em tempo real: userThreads/{uid}/items */
export function subscribeToMyThreads(
  uid: string,
  onData: (threads: ChatThread[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirestoreDb(), "userThreads", uid, "items"),
    orderBy("updatedAt", "desc"),
    limit(50),
  );
  return onSnapshot(
    q,
    (snap) => {
      const threads: ChatThread[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id:
            typeof data.threadId === "string" ? data.threadId : d.id,
          peerId: typeof data.peerId === "string" ? data.peerId : undefined,
          participantIds: Array.isArray(data.participantIds)
            ? (data.participantIds as string[])
            : [],
          updatedAt: parseDate(data.updatedAt),
          lastMessagePreview:
            typeof data.lastMessagePreview === "string"
              ? data.lastMessagePreview
              : null,
          lastSenderId:
            typeof data.lastSenderId === "string" ? data.lastSenderId : null,
        };
      });
      onData(threads);
    },
    (err) => onError?.(err),
  );
}

export async function getThread(threadId: string): Promise<ChatThread | null> {
  const snap = await getDoc(doc(getFirestoreDb(), "threads", threadId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    participantIds: Array.isArray(data.participantIds)
      ? (data.participantIds as string[])
      : [],
    updatedAt: parseDate(data.updatedAt),
    lastMessagePreview:
      typeof data.lastMessagePreview === "string"
        ? data.lastMessagePreview
        : null,
    lastSenderId:
      typeof data.lastSenderId === "string" ? data.lastSenderId : null,
  };
}

/** Restaura preview na inbox a partir do doc da thread (mensagens antigas). */
export async function syncInboxPreviewFromThread(
  myUid: string,
  threadId: string,
): Promise<ChatThread | null> {
  const thread = await getThread(threadId);
  if (!thread?.lastMessagePreview) return thread;
  const peerId = thread.participantIds.find((id) => id !== myUid);
  if (!peerId || thread.participantIds.length !== 2) return thread;

  await upsertInboxItem({
    inboxUid: myUid,
    threadId,
    peerId,
    participantIds: thread.participantIds,
    touchPreview: true,
    lastMessagePreview: thread.lastMessagePreview,
    lastSenderId: thread.lastSenderId,
  });

  return {
    ...thread,
    peerId,
  };
}

export async function getPublicProfile(uid: string): Promise<{
  displayName: string;
  cityId: string | null;
} | null> {
  const snap = await getDoc(doc(getFirestoreDb(), "publicProfiles", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    displayName:
      typeof data.displayName === "string" ? data.displayName : "Treinador",
    cityId: typeof data.cityId === "string" ? data.cityId : null,
  };
}
