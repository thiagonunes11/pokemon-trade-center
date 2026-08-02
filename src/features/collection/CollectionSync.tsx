import {
  pullAndMergeCollection,
  setCollectionSyncUser,
} from "@/features/collection/firestoreSync";
import { ensurePublicShowcaseSynced } from "@/features/profile/showcaseMirror";
import { pruneWantedOwnedCards } from "@/features/trades/tradeActions";
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
    pruneWantedOwnedCards();

    if (lastPulledUid.current === userId) return;
    lastPulledUid.current = userId;
    void pullAndMergeCollection(userId)
      .then(() => {
        pruneWantedOwnedCards();
        return ensurePublicShowcaseSynced(userId);
      })
      .catch((err) => console.warn("[CollectionSync] showcase backfill", err));
  }, [userId, isAuthReady]);

  return null;
}
