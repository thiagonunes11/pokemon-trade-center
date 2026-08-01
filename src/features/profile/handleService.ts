import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firestore";
import {
  looksLikeFirebaseUid,
  normalizeHandle,
  validateHandle,
  handleValidationMessage,
} from "@/lib/handle";

export class HandleTakenError extends Error {
  constructor() {
    super("HANDLE_TAKEN");
    this.name = "HandleTakenError";
  }
}

export class HandleInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HandleInvalidError";
  }
}

export async function getHandleForUid(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(getFirestoreDb(), "publicProfiles", uid));
  if (!snap.exists()) return null;
  const h = snap.data().handle;
  return typeof h === "string" && h.length > 0 ? h : null;
}

export async function resolveUidFromProfileParam(
  param: string,
): Promise<string | null> {
  const raw = param.trim();
  if (!raw) return null;

  const asHandle = normalizeHandle(raw);
  if (asHandle) {
    const handleSnap = await getDoc(doc(getFirestoreDb(), "handles", asHandle));
    if (handleSnap.exists()) {
      const uid = handleSnap.data().uid;
      if (typeof uid === "string" && uid.length > 0) return uid;
    }
  }

  if (looksLikeFirebaseUid(raw)) {
    const profile = await getDoc(doc(getFirestoreDb(), "publicProfiles", raw));
    if (profile.exists()) return raw;
    // Perfil pode não existir ainda, mas o uid é válido para coleção/listings
    return raw;
  }

  return null;
}

/**
 * Reserva ou troca o slug do usuário (transação).
 * Atualiza `handles/{slug}`, `publicProfiles/{uid}.handle` e `users/{uid}.handle`.
 */
export async function claimHandle(uid: string, raw: string): Promise<string> {
  const checked = validateHandle(raw);
  if (!checked.ok) {
    throw new HandleInvalidError(handleValidationMessage(checked.error));
  }
  const next = checked.handle;
  const db = getFirestoreDb();

  try {
    await runTransaction(db, async (tx) => {
      const handleRef = doc(db, "handles", next);
      const handleSnap = await tx.get(handleRef);
      if (handleSnap.exists()) {
        const owner = handleSnap.data().uid;
        if (owner !== uid) {
          throw new HandleTakenError();
        }
      }

      const profileRef = doc(db, "publicProfiles", uid);
      const userRef = doc(db, "users", uid);
      const profileSnap = await tx.get(profileRef);
      const prev =
        profileSnap.exists() && typeof profileSnap.data().handle === "string"
          ? (profileSnap.data().handle as string)
          : null;

      if (prev && prev !== next) {
        const prevRef = doc(db, "handles", prev);
        const prevSnap = await tx.get(prevRef);
        if (prevSnap.exists() && prevSnap.data().uid === uid) {
          tx.delete(prevRef);
        }
      }

      tx.set(handleRef, { uid, updatedAt: serverTimestamp() });
      const displayName =
        profileSnap.exists() &&
        typeof profileSnap.data().displayName === "string"
          ? (profileSnap.data().displayName as string)
          : "Treinador";
      tx.set(
        profileRef,
        {
          handle: next,
          displayName,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      tx.set(userRef, { handle: next }, { merge: true });
    });
  } catch (err) {
    if (err instanceof HandleTakenError || err instanceof HandleInvalidError) {
      throw err;
    }
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    if (code === "already-exists" || code === "aborted") {
      throw new HandleTakenError();
    }
    throw err;
  }

  return next;
}
