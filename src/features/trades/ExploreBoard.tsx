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

function exploreErrorMessage(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  if (code === "permission-denied") {
    return "Sem permissão para ler o mural. Faça deploy das regras Firestore.";
  }
  if (code === "failed-precondition" || code === "unimplemented") {
    return "Índice do Firestore ainda não está pronto. Rode: firebase deploy --only firestore";
  }
  return "Não foi possível carregar o mural. Verifique a conexão e o deploy do Firestore.";
}

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
  const [chatError, setChatError] = useState<string | null>(null);
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
      setError(exploreErrorMessage(err));
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
    setChatError(null);
    try {
      const threadId = await ensureThread(userId, peerId);
      navigate(`/trades/chat/${threadId}`, {
        state: { peerHint: cardName },
      });
    } catch (err) {
      console.warn("[Explore] chat", err);
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      setChatError(
        code === "permission-denied"
          ? "Sem permissão para iniciar conversa. Faça deploy das regras Firestore."
          : "Não foi possível abrir a conversa. Tente de novo.",
      );
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
            className={`min-h-11 flex-1 rounded-xl text-sm font-bold ${
              kind === opt.key
                ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                : "border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] px-3">
        <input
          type="checkbox"
          checked={onlyMine}
          onChange={(e) => setOnlyMine(e.target.checked)}
          className="h-5 w-5 accent-[var(--color-accent)]"
        />
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {filterLabel}
        </span>
      </label>

      {chatError ? (
        <p className="text-sm text-[var(--color-error)]">{chatError}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Carregando mural…</p>
      ) : error ? (
        <div className="space-y-3 rounded-2xl border border-[var(--color-error)]/40 bg-[var(--color-bg-card)] p-4">
          <p className="text-sm text-[var(--color-error)]">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="min-h-10 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)]"
          >
            Tentar de novo
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          {onlyMine
            ? "Nenhum anúncio cruza com suas listas ainda."
            : "Nenhum anúncio de outros usuários por enquanto. Os seus não aparecem aqui — só os de outras pessoas."}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3"
            >
              <div className="w-[6.5rem] shrink-0 sm:w-28">
                <CardItem
                  id={item.cardId}
                  name={item.name}
                  localId={item.cardId.split("-").pop() ?? ""}
                  image={item.imageUrl}
                  compact
                  onPress={() => navigate(`/card/${item.cardId}`)}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="line-clamp-2 text-sm font-bold leading-snug text-[var(--color-text)] sm:text-base">
                  {item.name}
                </p>
                <p className="truncate text-xs font-medium text-[var(--color-text-secondary)] sm:text-sm">
                  {item.displayName}
                  <span className="text-[var(--color-text-muted)]">
                    {kind === "offering" ? " · anunciando" : " · procurando"}
                  </span>
                </p>
                <button
                  type="button"
                  disabled={startingChat === item.ownerId}
                  onClick={() => void startChat(item.ownerId, item.displayName)}
                  className="mt-1.5 inline-flex min-h-10 items-center rounded-lg bg-[var(--color-accent)] px-3.5 text-sm font-bold text-[var(--color-on-accent)] disabled:opacity-50"
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
