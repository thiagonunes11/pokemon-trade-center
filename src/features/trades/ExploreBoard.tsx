import { CardItem } from "@/features/cards";
import {
  fetchListingsForCardIds,
  fetchListingsPage,
  type PublicListing,
} from "@/features/trades/listingsQuery";
import { ensureThread } from "@/features/trades/threadsService";
import { useAuthStore } from "@/store/useAuthStore";
import { useTradeStore } from "@/store/useTradeStore";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import type { TradeListKind } from "@/store/useTradeStore";

type ExploreKind = TradeListKind;

export function ExploreBoard() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const offering = useTradeStore((s) => s.offering);
  const wanted = useTradeStore((s) => s.wanted);

  const [kind, setKind] = useState<ExploreKind>("offering");
  const [onlyMine, setOnlyMine] = useState(false);
  const [items, setItems] = useState<PublicListing[]>([]);
  const [cursor, setCursor] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  const myWantedIds = useMemo(
    () =>
      wanted
        .filter((c) => (c.ownerId ?? null) === (userId ?? null))
        .map((c) => c.id),
    [wanted, userId],
  );
  const myOfferingIds = useMemo(
    () =>
      offering
        .filter((c) => (c.ownerId ?? null) === (userId ?? null))
        .map((c) => c.id),
    [offering, userId],
  );

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      if (onlyMine) {
        const ids = kind === "offering" ? myWantedIds : myOfferingIds;
        const list = await fetchListingsForCardIds(kind, ids);
        setItems(list.filter((l) => l.ownerId !== userId));
        setCursor(null);
        setHasMore(false);
      } else {
        const page = await fetchListingsPage(kind, null);
        setItems(page.items.filter((l) => l.ownerId !== userId));
        setCursor(page.lastDoc);
        setHasMore(page.hasMore);
      }
    } catch (err) {
      console.warn("[Explore]", err);
      setError("Não foi possível carregar o mural. Tente de novo.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId, kind, onlyMine, myWantedIds, myOfferingIds]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = async () => {
    if (!userId || !hasMore || !cursor || onlyMine) return;
    setLoadingMore(true);
    try {
      const page = await fetchListingsPage(kind, cursor);
      setItems((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const next = page.items.filter(
          (l) => l.ownerId !== userId && !ids.has(l.id),
        );
        return [...prev, ...next];
      });
      setCursor(page.lastDoc);
      setHasMore(page.hasMore);
    } catch (err) {
      console.warn("[Explore] loadMore", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const startChat = async (peerId: string, cardName: string) => {
    if (!userId || peerId === userId) return;
    setStartingChat(peerId);
    try {
      const threadId = await ensureThread(userId, peerId);
      navigate(`/trades/chat/${threadId}`, {
        state: { peerHint: cardName },
      });
    } catch (err) {
      console.warn("[Explore] chat", err);
      setError("Não foi possível abrir a conversa.");
    } finally {
      setStartingChat(null);
    }
  };

  const filterLabel =
    kind === "offering"
      ? "Só o que eu procuro"
      : "Só o que eu anuncio";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(
          [
            { key: "offering" as const, label: "Anúncios" },
            { key: "wanted" as const, label: "Procuras" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setKind(opt.key)}
            className={`min-h-10 flex-1 rounded-xl text-sm font-semibold ${
              kind === opt.key
                ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                : "border border-[var(--color-border)] text-[var(--color-text-secondary)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3">
        <input
          type="checkbox"
          checked={onlyMine}
          onChange={(e) => setOnlyMine(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        <span className="text-sm text-[var(--color-text)]">{filterLabel}</span>
      </label>

      {error ? (
        <p className="text-sm text-[var(--color-error)]">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Carregando mural…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          {onlyMine
            ? "Nenhum anúncio cruza com suas listas ainda."
            : "Nenhum anúncio público por enquanto. Seja o primeiro a publicar."}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3"
            >
              <div className="w-20 shrink-0">
                <CardItem
                  id={item.cardId}
                  name={item.name}
                  localId={item.cardId.split("-").pop() ?? ""}
                  image={item.imageUrl}
                  compact
                  onPress={() => navigate(`/card/${item.cardId}`)}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div>
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                    {item.name}
                  </p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">
                    {item.displayName}
                    {kind === "offering" ? " · anunciando" : " · procurando"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={startingChat === item.ownerId}
                  onClick={() => void startChat(item.ownerId, item.displayName)}
                  className="min-h-10 rounded-xl bg-[var(--color-accent)] px-3 text-sm font-bold text-[var(--color-on-accent)] disabled:opacity-50"
                >
                  {startingChat === item.ownerId ? "Abrindo…" : "Conversar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!onlyMine && hasMore ? (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => void loadMore()}
          className="min-h-11 w-full rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)]"
        >
          {loadingMore ? "Carregando…" : "Carregar mais"}
        </button>
      ) : null}
    </div>
  );
}
