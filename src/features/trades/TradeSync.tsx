import {
  pullAndMergeTrades,
  setTradeSyncUser,
} from "@/features/trades/firestoreSync";
import { pruneWantedOwnedCards } from "@/features/trades/tradeActions";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useRef } from "react";

export function TradeSync() {
  const userId = useAuthStore((s) => s.userId);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const lastPulledUid = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!userId) {
      setTradeSyncUser(null);
      lastPulledUid.current = null;
      return;
    }

    setTradeSyncUser(userId);
    pruneWantedOwnedCards();
    if (lastPulledUid.current === userId) return;
    lastPulledUid.current = userId;
    void pullAndMergeTrades(userId).then(() => {
      pruneWantedOwnedCards();
    });
  }, [userId, isAuthReady]);

  return null;
}
