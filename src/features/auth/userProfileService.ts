import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firestore";
import type { User } from "firebase/auth";

/**
 * Cria o documento de perfil `users/{uid}` no Firestore.
 * Usa `merge: true` para não sobrescrever campos existentes
 * (ex.: se o documento já foi criado por outra sessão).
 *
 * Chamado após o registro com e-mail e senha.
 */
export async function createUserProfile(user: User): Promise<void> {
  const db = getFirestoreDb();
  const userRef = doc(db, "users", user.uid);

  await setDoc(
    userRef,
    {
      displayName: user.displayName ?? user.email?.split("@")[0] ?? "Treinador",
      email: user.email,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Atualiza campos do perfil `users/{uid}` no Firestore.
 * Usado para espelhar alterações feitas via Firebase Auth
 * (ex.: `updateDisplayName`).
 */
export async function updateUserProfile(
  uid: string,
  data: { displayName?: string },
): Promise<void> {
  const db = getFirestoreDb();
  const userRef = doc(db, "users", uid);

  // Filtrar campos undefined para não enviar ao Firestore
  const updates: Record<string, unknown> = {};
  if (data.displayName !== undefined) {
    updates.displayName = data.displayName;
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(userRef, updates);
  }
}
