import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp, isFirebaseConfigured } from "./firebase";

let firestoreInstance: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase não configurado. Veja .env.example e README (Firebase).",
    );
  }
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getFirebaseApp());
  }
  return firestoreInstance;
}
