import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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

export async function ensureThread(
  myUid: string,
  peerUid: string,
): Promise<string> {
  const id = threadIdFor(myUid, peerUid);
  const ref = doc(getFirestoreDb(), "threads", id);
  // Não usar getDoc antes: rules bloqueiam leitura de doc inexistente.
  // merge cria se não existe e não apaga lastMessagePreview se já existir.
  await setDoc(
    ref,
    {
      participantIds: [myUid, peerUid].sort(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
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
  const messagesRef = collection(db, "threads", threadId, "messages");
  await addDoc(messagesRef, {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "threads", threadId), {
    updatedAt: serverTimestamp(),
    lastMessagePreview: trimmed.slice(0, 200),
    lastSenderId: senderId,
  });
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

export async function fetchMyThreads(uid: string): Promise<ChatThread[]> {
  // Só array-contains (sem orderBy) — evita depender do índice composto.
  const q = query(
    collection(getFirestoreDb(), "threads"),
    where("participantIds", "array-contains", uid),
    limit(50),
  );
  const snap = await getDocs(q);
  const threads = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
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
  return threads.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

/** Lista em tempo real das conversas do usuário. */
export function subscribeToMyThreads(
  uid: string,
  onData: (threads: ChatThread[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirestoreDb(), "threads"),
    where("participantIds", "array-contains", uid),
    limit(50),
  );
  return onSnapshot(
    q,
    (snap) => {
      const threads = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
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
      threads.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
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
