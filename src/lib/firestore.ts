import { getFirestore, type Firestore } from "firebase/firestore";
import { isFirebaseConfigured } from "./firebase";

let firestoreInstance: Firestore | null = null;

/**
 * Retorna a instância singleton do Cloud Firestore.
 * Reutiliza o FirebaseApp já inicializado por `firebase.ts`.
 *
 * Lança erro se o Firebase não estiver configurado (`.env` ausente).
 */
export function getFirestoreDb(): Firestore {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase não configurado. Veja .env.example e README (Firebase).",
    );
  }
  if (!firestoreInstance) {
    // getFirestore() sem argumento usa o app default (já inicializado por getFirebaseAuth)
    firestoreInstance = getFirestore();
  }
  return firestoreInstance;
}
