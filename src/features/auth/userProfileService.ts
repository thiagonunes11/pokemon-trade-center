import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { syncPublicProfile } from "@/features/trades/communities";
import { getFirestoreDb } from "@/lib/firestore";
import type { User } from "firebase/auth";

/**
 * Cria o documento de perfil `users/{uid}` no Firestore.
 * Usa `merge: true` para não sobrescrever campos existentes.
 */
export async function createUserProfile(user: User): Promise<void> {
  const db = getFirestoreDb();
  const userRef = doc(db, "users", user.uid);
  const displayName =
    user.displayName ?? user.email?.split("@")[0] ?? "Treinador";

  await setDoc(
    userRef,
    {
      displayName,
      email: user.email,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  try {
    await syncPublicProfile(user.uid, { displayName });
  } catch (error) {
    console.warn("[Profile] Falha ao criar publicProfiles:", error);
  }
}

/**
 * Atualiza campos do perfil `users/{uid}` no Firestore.
 */
export async function updateUserProfile(
  uid: string,
  data: { displayName?: string; cityId?: string | null },
): Promise<void> {
  const db = getFirestoreDb();
  const userRef = doc(db, "users", uid);

  const updates: Record<string, unknown> = {};
  if (data.displayName !== undefined) {
    updates.displayName = data.displayName;
  }
  if (data.cityId !== undefined) {
    updates.cityId = data.cityId;
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(userRef, updates);
  }

  const displayName =
    data.displayName ??
    (await getDoc(userRef)).data()?.displayName ??
    "Treinador";

  try {
    await syncPublicProfile(uid, {
      displayName: typeof displayName === "string" ? displayName : "Treinador",
      cityId: data.cityId,
    });
  } catch (error) {
    console.warn("[Profile] Falha ao sincronizar publicProfiles:", error);
  }
}
