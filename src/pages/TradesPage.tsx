import { CardItem } from "@/features/cards";
import { useSetCards } from "@/features/cards";
import { CommunityPanel } from "@/features/trades/CommunityPanel";
import { ConversationsList } from "@/features/trades/ConversationsList";
import { ExploreBoard } from "@/features/trades/ExploreBoard";
import {
  addCardToOffering,
  addCardToWanted,
  removeCardFromOffering,
  removeCardFromWanted,
} from "@/features/trades";
import { COLLECTIONS, getCollectionById } from "@/lib/collections";
import {
  cardLocalId,
  compareByLocalId,
  compareBySetAndNumber,
} from "@/lib/cardOrder";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useTradeStore } from "@/store/useTradeStore";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

type TradeTab =
  | "offering"
  | "wanted"
  | "explore"
  | "chats"
  | "community";

function isTradeTab(value: string | null): value is TradeTab {
  return (
    value === "offering" ||
    value === "wanted" ||
    value === "explore" ||
    value === "chats" ||
    value === "community"
  );
}

const TAB_DESCRIPTIONS: Record<TradeTab, string> = {
  explore:
    "Veja anúncios e procuras de outras pessoas e inicie uma conversa no app.",
  offering:
    "Liste cartas da sua coleção que você quer trocar. Elas aparecem no mural público.",
  wanted:
    "Liste cartas que você busca. Assim fica mais fácil cruzar com o que outros anunciam.",
  chats:
    "Acompanhe as conversas de troca abertas com outros colecionadores.",
  community:
    "Entre no grupo de WhatsApp da sua cidade para combinar trocas presenciais.",
};

type PickerMode =
  | null
  | { kind: "offering" }
  | { kind: "wanted"; step: "sets" }
  | { kind: "wanted"; step: "cards"; setId: string };

function TradeSectionTabs({
  tab,
  onChange,
  offeringCount,
  wantedCount,
}: {
  tab: TradeTab;
  onChange: (tab: TradeTab) => void;
  offeringCount: number;
  wantedCount: number;
}) {
  const primary = [
    { key: "explore" as const, label: "Explorar" },
    { key: "offering" as const, label: "Anunciando", count: offeringCount },
    { key: "wanted" as const, label: "Procurando", count: wantedCount },
  ];
  const secondary = [
    { key: "chats" as const, label: "Conversas" },
    { key: "community" as const, label: "Comunidade" },
  ];

  const renderBtn = (
    opt: { key: TradeTab; label: string; count?: number },
  ) => {
    const active = tab === opt.key;
    return (
      <button
        key={opt.key}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => onChange(opt.key)}
        className={`min-h-11 rounded-lg px-2 text-sm font-bold ${
          active
            ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
        }`}
      >
        {opt.label}
        {opt.count != null ? (
          <span
            className={`ml-1 tabular-nums ${
              active
                ? "text-[var(--color-on-accent)]/80"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            {opt.count}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div
      className="space-y-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-1"
      role="tablist"
      aria-label="Seções de trocas"
    >
      <div className="grid grid-cols-3 gap-1">{primary.map(renderBtn)}</div>
      <div className="grid grid-cols-2 gap-1">{secondary.map(renderBtn)}</div>
    </div>
  );
}

export function TradesPage() {
  const userId = useAuthStore((s) => s.userId);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<TradeTab>(() =>
    isTradeTab(tabParam) ? tabParam : "explore",
  );
  const [picker, setPicker] = useState<PickerMode>(null);
  const [clearWantedOpen, setClearWantedOpen] = useState(false);

  const selectTab = (next: TradeTab) => {
    setTab(next);
    setSearchParams(
      next === "explore" ? {} : { tab: next },
      { replace: true },
    );
  };

  const offering = useTradeStore((s) => s.offering);
  const wanted = useTradeStore((s) => s.wanted);
  const collectionCards = useCollectionStore((s) => s.cards);

  const myOffering = useMemo(
    () =>
      offering
        .filter((c) => (c.ownerId ?? null) === (userId ?? null))
        .sort(compareBySetAndNumber),
    [offering, userId],
  );

  const myWanted = useMemo(
    () =>
      wanted
        .filter((c) => (c.ownerId ?? null) === (userId ?? null))
        .sort(compareBySetAndNumber),
    [wanted, userId],
  );

  const myCollection = useMemo(
    () =>
      collectionCards
        .filter((c) => (c.ownerId ?? null) === (userId ?? null))
        .sort(compareBySetAndNumber),
    [collectionCards, userId],
  );

  const list = tab === "offering" ? myOffering : myWanted;
  const showMyLists = tab === "offering" || tab === "wanted";

  return (
    <div className="space-y-5 pb-8">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[var(--color-text)]">
          Trocas
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {TAB_DESCRIPTIONS[tab]}
        </p>
      </header>

      <TradeSectionTabs
        tab={tab}
        onChange={selectTab}
        offeringCount={myOffering.length}
        wantedCount={myWanted.length}
      />

      {tab === "explore" ? <ExploreBoard /> : null}
      {tab === "chats" ? <ConversationsList /> : null}
      {tab === "community" ? <CommunityPanel /> : null}

      {showMyLists ? (
        <>
          <button
            type="button"
            onClick={() =>
              setPicker(
                tab === "offering"
                  ? { kind: "offering" }
                  : { kind: "wanted", step: "sets" },
              )
            }
            className="ui-btn-accent flex h-11 w-full items-center justify-center text-sm"
          >
            {tab === "offering"
              ? "Adicionar da coleção"
              : "Adicionar do catálogo"}
          </button>

          {tab === "wanted" && list.length > 0 ? (
            <button
              type="button"
              onClick={() => setClearWantedOpen(true)}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-[var(--color-error)] text-sm font-bold text-[var(--color-error)]"
            >
              Limpar busca ({list.length})
            </button>
          ) : null}

          {list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
              {tab === "offering"
                ? "Nenhuma carta anunciada. Adicione cartas que você tem e quer trocar."
                : "Nenhuma carta na lista de procura. Adicione o que você busca."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {list.map((card) => (
                <div key={card.id} className="relative">
                  <button
                    type="button"
                    aria-label="Remover da lista"
                    onClick={() =>
                      tab === "offering"
                        ? removeCardFromOffering(card.id)
                        : removeCardFromWanted(card.id)
                    }
                    className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white"
                  >
                    ×
                  </button>
                  <CardItem
                    id={card.id}
                    name={card.name}
                    localId={cardLocalId(card.id, card.setId)}
                    image={card.imageUrl}
                    compact
                    onPress={() => {}}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {picker ? (
        <TradePickerModal
          mode={picker}
          collectionCards={myCollection}
          offeringIds={new Set(myOffering.map((c) => c.id))}
          wantedIds={new Set(myWanted.map((c) => c.id))}
          onClose={() => setPicker(null)}
          onPickOffering={(card) => {
            addCardToOffering(card);
          }}
          onPickWanted={(card) => {
            addCardToWanted(card);
          }}
          onSelectSet={(setId) =>
            setPicker({ kind: "wanted", step: "cards", setId })
          }
          onBackToSets={() => setPicker({ kind: "wanted", step: "sets" })}
        />
      ) : null}

      <ConfirmDialog
        open={clearWantedOpen}
        title={
          list.length === 1
            ? "Limpar a busca?"
            : `Limpar a busca (${list.length} cartas)?`
        }
        message="Remove todas as cartas da sua lista Procurando."
        confirmLabel="Limpar"
        danger
        onCancel={() => setClearWantedOpen(false)}
        onConfirm={() => {
          for (const card of list) {
            removeCardFromWanted(card.id);
          }
          setClearWantedOpen(false);
        }}
      />
    </div>
  );
}

function TradePickerModal({
  mode,
  collectionCards,
  offeringIds,
  wantedIds,
  onClose,
  onPickOffering,
  onPickWanted,
  onSelectSet,
  onBackToSets,
}: {
  mode: Exclude<PickerMode, null>;
  collectionCards: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    setId: string;
  }>;
  offeringIds: Set<string>;
  wantedIds: Set<string>;
  onClose: () => void;
  onPickOffering: (card: {
    id: string;
    name: string;
    imageUrl: string | null;
    setId: string;
  }) => void;
  onPickWanted: (card: {
    id: string;
    name: string;
    imageUrl: string | null;
    setId: string;
  }) => void;
  onSelectSet: (setId: string) => void;
  onBackToSets: () => void;
}) {
  const wantedSetId =
    mode.kind === "wanted" && mode.step === "cards" ? mode.setId : "";
  const { data: setData, isLoading } = useSetCards(wantedSetId);

  const wantedSetCards = useMemo(
    () => [...(setData?.cards ?? [])].sort(compareByLocalId),
    [setData?.cards],
  );

  const title =
    mode.kind === "offering"
      ? "Escolher da coleção"
      : mode.step === "sets"
        ? "Escolher expansão"
        : (getCollectionById(mode.setId)?.name ?? mode.setId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {mode.kind === "wanted" && mode.step === "cards" ? (
            <button
              type="button"
              onClick={onBackToSets}
              className="text-sm font-semibold text-[var(--color-accent)]"
            >
              ← Sets
            </button>
          ) : null}
          <h2 className="truncate font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-text)]">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text)]"
        >
          Fechar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {mode.kind === "offering" ? (
          collectionCards.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Sua coleção está vazia. Adicione cartas pelo catálogo primeiro.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {collectionCards.map((card) => {
                const already = offeringIds.has(card.id);
                return (
                  <div key={card.id} className="relative">
                    {already ? (
                      <span className="absolute top-2 left-2 z-10 rounded-md bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-on-accent)]">
                        Já na lista
                      </span>
                    ) : null}
                    <CardItem
                      id={card.id}
                      name={card.name}
                      localId={cardLocalId(card.id, card.setId)}
                      image={card.imageUrl}
                      compact
                      onPress={() => {
                        if (already) return;
                        onPickOffering({
                          id: card.id,
                          name: card.name,
                          imageUrl: card.imageUrl,
                          setId: card.setId,
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )
        ) : mode.step === "sets" ? (
          <div className="space-y-2">
            {COLLECTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectSet(c.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 text-left hover:border-[var(--color-accent)]"
              >
                <img
                  src={c.logoUrl}
                  alt=""
                  className="h-10 w-16 object-contain"
                />
                <span className="font-semibold text-[var(--color-text)]">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        ) : isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Carregando cartas…
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {wantedSetCards.map((card) => {
              const already = wantedIds.has(card.id);
              const image = card.image ?? null;
              return (
                <div key={card.id} className="relative">
                  {already ? (
                    <span className="absolute top-2 left-2 z-10 rounded-md bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-on-accent)]">
                      Já na lista
                    </span>
                  ) : null}
                  <CardItem
                    id={card.id}
                    name={card.name}
                    localId={String(card.localId)}
                    image={image}
                    compact
                    onPress={() => {
                      if (already) return;
                      onPickWanted({
                        id: card.id,
                        name: card.name,
                        imageUrl: image
                          ? image.toLowerCase().endsWith(".webp") ||
                            image.toLowerCase().endsWith(".png")
                            ? image
                            : `${image}/high.webp`
                          : null,
                        setId: mode.setId,
                      });
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
