import { CardItem } from "@/features/cards";
import { EmptyState } from "@/components/EmptyState";
import { hasValidOfferingTerms } from "@/features/trades/offeringTerms";
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

function isVisibleListing(listing: PublicListing, kind: ExploreKind): boolean {
  if (kind !== "offering") return true;
  return hasValidOfferingTerms({
    priceBRL: listing.priceBRL,
    wantCards: listing.wantCards,
  });
}

function OfferingTermsSummary({ listing }: { listing: PublicListing }) {
  const wantedNames = listing.wantCards
    .slice(0, 2)
    .map((w) => w.name)
    .join(", ");
  const extraWanted = Math.max(listing.wantCards.length - 2, 0);

  return (
    <div className="flex flex-wrap gap-1.5">
      {listing.priceBRL ? (
        <span className="rounded-full bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] px-2 py-1 text-xs font-bold text-[var(--color-text)]">
          R$ {listing.priceBRL.toFixed(2).replace(".", ",")}
        </span>
      ) : null}
      {listing.wantCards.length ? (
        <span
          title={listing.wantCards.map((w) => w.name).join(", ")}
          className="line-clamp-2 rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-secondary)]"
        >
          Troca por: {wantedNames}
          {extraWanted ? ` +${extraWanted}` : ""}
        </span>
      ) : null}
    </div>
  );
}

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
        setItems(
          list.filter(
            (l) => l.ownerId !== userId && isVisibleListing(l, kind),
          ),
        );
        setCursor(null);
        setHasMore(false);
      } else {
        const page = await fetchListingsPage(kind, null);
        setItems(
          page.items.filter(
            (l) => l.ownerId !== userId && isVisibleListing(l, kind),
          ),
        );
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
          (l) =>
            l.ownerId !== userId &&
            !ids.has(l.id) &&
            isVisibleListing(l, kind),
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
      <div className="ui-segment" role="tablist" aria-label="Tipo de publicação">
        {(
          [
            { key: "offering" as const, label: "Disponíveis" },
            { key: "wanted" as const, label: "Buscas" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={kind === opt.key}
            data-active={kind === opt.key}
            onClick={() => setKind(opt.key)}
            className="ui-segment-item px-3"
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className="ui-glass flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 transition hover:border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-border))]">
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
        <p role="alert" className="rounded-xl border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] px-3 py-2.5 text-sm text-[var(--color-error)]">{chatError}</p>
      ) : null}

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Carregando mural">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="ui-glass flex gap-4 rounded-2xl p-4">
              <div className="ui-skeleton aspect-[0.72] w-24 shrink-0" />
              <div className="flex flex-1 flex-col justify-center gap-3">
                <div className="ui-skeleton h-5 w-3/4" />
                <div className="ui-skeleton h-4 w-1/2" />
                <div className="ui-skeleton h-11 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="space-y-3 rounded-2xl border border-[var(--color-error)]/40 bg-[var(--color-bg-card)] p-4">
          <p role="alert" className="text-sm text-[var(--color-error)]">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="min-h-11 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)]"
          >
            Tentar de novo
          </button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={onlyMine ? "Nenhum cruzamento por enquanto" : "O mural está começando"}
          description={
            onlyMine
              ? "Quando alguém anunciar uma carta que você procura, ela aparecerá aqui."
              : "As publicações de outros treinadores aparecerão aqui. Suas cartas ficam em Minhas ofertas."
          }
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="ui-glass ui-card-lift overflow-hidden rounded-2xl p-4"
            >
              <div className="flex gap-4">
                <div className="w-24 shrink-0 sm:w-28">
                  <CardItem
                    id={item.cardId}
                    name={item.name}
                    localId={item.cardId.split("-").pop() ?? ""}
                    image={item.imageUrl}
                    compact
                    onPress={() => navigate(`/card/${item.cardId}`)}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                  <span className="w-fit rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[var(--color-text-muted)] uppercase">
                    {kind === "offering" ? "Disponível" : "Procura"}
                  </span>
                  <p className="line-clamp-2 text-xl font-bold leading-tight text-[var(--color-text)] sm:text-2xl">
                    {item.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/u/${item.ownerId}`)}
                    className="min-h-11 truncate text-left text-sm font-bold text-[color-mix(in_srgb,var(--color-accent)_82%,var(--color-text))] underline-offset-2 hover:underline"
                  >
                    {item.displayName}
                  </button>
                </div>
              </div>
              {kind === "offering" ? (
                <>
                  <div className="ui-glass mt-3 rounded-xl p-2.5">
                    <OfferingTermsSummary listing={item} />
                  </div>
                  <button
                    type="button"
                    disabled={startingChat === item.ownerId}
                    onClick={() => void startChat(item.ownerId, item.displayName)}
                    className="ui-btn-accent mt-3 min-h-12 w-full text-sm disabled:opacity-50"
                  >
                    {startingChat === item.ownerId ? "Abrindo…" : "Conversar"}
                  </button>
                </>
              ) : null}
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
