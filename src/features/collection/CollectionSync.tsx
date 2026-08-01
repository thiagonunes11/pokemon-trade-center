import {
  pullAndMergeCollection,
  setCollectionSyncUser,
} from "@/features/collection/firestoreSync";
import { backfillPublicShowcase } from "@/features/profile/showcaseMirror";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
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
    void pullAndMergeCollection(userId)
      .then(() => {
        const showcase = useCollectionStore
          .getState()
          .cards.filter(
            (c) =>
              (c.ownerId ?? null) === userId && Boolean(c.inShowcase),
          )
          .map((c) => ({
            id: c.id,
            name: c.name,
            imageUrl: c.imageUrl,
            setId: c.setId,
          }));
        return backfillPublicShowcase(userId, showcase);
      })
      .catch((err) => console.warn("[CollectionSync] showcase backfill", err));
  }, [userId, isAuthReady]);

  return null;
}
