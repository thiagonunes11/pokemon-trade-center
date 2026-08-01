import {
  pullAndMergeCollection,
  setCollectionSyncUser,
} from "@/features/collection/firestoreSync";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useRef } from "react";

/** Puxa a coleção remota uma vez por sessão/usuário (sem listener permanente). */
export function CollectionSync() {
  const userId = useAuthStore((s) => s.userId);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const lastPulledUid = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!userId) {
      setCollectionSyncUser(null);
      lastPulledUid.current = null;
      return;
    }

    setCollectionSyncUser(userId);

    if (lastPulledUid.current === userId) return;
    lastPulledUid.current = userId;
    void pullAndMergeCollection(userId);
  }, [userId, isAuthReady]);

  return null;
}
