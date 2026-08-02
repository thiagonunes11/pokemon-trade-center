import { CardItem } from "@/features/cards";
import { useSetCards } from "@/features/cards";
import { CommunityPanel } from "@/features/trades/CommunityPanel";
import { ConversationsList } from "@/features/trades/ConversationsList";
import { ExploreBoard } from "@/features/trades/ExploreBoard";
import {
  addCardToOffering,
  addCardToWanted,
  hasValidOfferingTerms,
  OfferingTermsPanel,
  removeCardFromOffering,
  removeCardFromWanted,
  updateOfferingTermsAndSync,
  type OfferingTerms,
} from "@/features/trades";
import { COLLECTIONS, getCollectionById } from "@/lib/collections";
import {
  cardLocalId,
  compareByLocalId,
  compareBySetAndNumber,
} from "@/lib/cardOrder";
import { tabSpring } from "@/lib/motion";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useTradeStore } from "@/store/useTradeStore";
import { motion } from "motion/react";
import { useEffect, useId, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
    "Gerencie as cartas da sua coleção que estão disponíveis para troca.",
  wanted:
    "Gerencie as cartas que você procura e cruze com ofertas da comunidade.",
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

type OfferingCardInput = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
};

type TermsPanelState =
  | null
  | {
      mode: "create" | "edit";
      card: OfferingCardInput;
      initialTerms?: OfferingTerms;
    };

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
  const options = [
    { key: "explore" as const, label: "Explorar" },
    { key: "offering" as const, label: "Minhas ofertas", count: offeringCount },
    { key: "wanted" as const, label: "Minha busca", count: wantedCount },
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
        className={`relative inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition sm:text-sm ${
          active
            ? "text-[var(--color-on-accent)]"
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
        }`}
      >
        {active ? (
          <motion.span
            layoutId="trades-section-tab"
            className="absolute inset-0 z-0 rounded-lg bg-[var(--color-accent)] shadow-[0_8px_22px_-12px_color-mix(in_srgb,var(--color-accent)_75%,transparent)]"
            transition={tabSpring}
          />
        ) : null}
        <span className="relative z-[1] inline-flex items-center gap-1.5">
          {opt.label}
          {opt.count != null ? (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                active
                  ? "bg-black/10 text-[var(--color-on-accent)]"
                  : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]"
              }`}
            >
              {opt.count}
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  return (
    <div
      className="ui-glass flex gap-1 overflow-x-auto rounded-2xl p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Seções de trocas"
    >
      {options.map(renderBtn)}
    </div>
  );
}

export function TradesPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<TradeTab>(() =>
    isTradeTab(tabParam) ? tabParam : "explore",
  );
  const [picker, setPicker] = useState<PickerMode>(null);
  const [termsPanel, setTermsPanel] = useState<TermsPanelState>(null);
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
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
          Trocas
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
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
            <EmptyState
              title={tab === "offering" ? "Nenhuma carta anunciada" : "Sua busca está vazia"}
              description={
                tab === "offering"
                  ? "Adicione cartas da sua coleção que você aceita trocar."
                  : "Adicione cartas do catálogo para cruzar com anúncios de outros treinadores."
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {list.map((card) => {
                const terms = {
                  priceBRL: card.priceBRL ?? null,
                  wantCards: card.wantCards ?? [],
                };
                const validTerms =
                  tab === "offering" && hasValidOfferingTerms(terms);
                const wantedNames = terms.wantCards
                  .slice(0, 2)
                  .map((wantedCard) => wantedCard.name)
                  .join(", ");
                const extraWanted = Math.max(terms.wantCards.length - 2, 0);

                return (
                  <div key={card.id} className="space-y-2">
                    <div className="relative">
                      <button
                        type="button"
                        aria-label="Remover da lista"
                        onClick={() =>
                          tab === "offering"
                            ? removeCardFromOffering(card.id)
                            : removeCardFromWanted(card.id)
                        }
                        className="absolute top-2 right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white shadow-md backdrop-blur-sm transition hover:bg-[var(--color-error)]"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden>
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                      <CardItem
                        id={card.id}
                        name={card.name}
                        localId={cardLocalId(card.id, card.setId)}
                        image={card.imageUrl}
                        compact
                        onPress={(id) => navigate(`/card/${id}`)}
                      />
                    </div>

                    {tab === "offering" ? (
                      <div className="ui-glass space-y-2 rounded-xl p-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {terms.priceBRL ? (
                            <span className="rounded-full bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] px-2 py-1 text-xs font-bold text-[var(--color-text)]">
                              R$ {terms.priceBRL.toFixed(2).replace(".", ",")}
                            </span>
                          ) : null}
                          {terms.wantCards.length ? (
                            <span
                              title={terms.wantCards
                                .map((wantedCard) => wantedCard.name)
                                .join(", ")}
                              className="line-clamp-2 rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-secondary)]"
                            >
                              Troca por: {wantedNames}
                              {extraWanted ? ` +${extraWanted}` : ""}
                            </span>
                          ) : null}
                          {!validTerms ? (
                            <span className="rounded-full bg-[color-mix(in_srgb,var(--color-error)_14%,transparent)] px-2 py-1 text-xs font-bold text-[var(--color-error)]">
                              Completar condições
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setTermsPanel({
                              mode: "edit",
                              card: {
                                id: card.id,
                                name: card.name,
                                imageUrl: card.imageUrl,
                                setId: card.setId,
                              },
                              initialTerms: terms,
                            })
                          }
                          className={
                            validTerms
                              ? "ui-tool-btn min-h-11 w-full"
                              : "ui-btn-accent min-h-11 w-full text-sm"
                          }
                        >
                          {validTerms
                            ? "Editar condições"
                            : "Completar condições"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
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
            setPicker(null);
            setTermsPanel({ mode: "create", card });
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

      <OfferingTermsPanel
        open={termsPanel != null}
        mode={termsPanel?.mode ?? "create"}
        card={termsPanel?.card ?? null}
        initialTerms={termsPanel?.initialTerms}
        onCancel={() => setTermsPanel(null)}
        onSave={(terms) => {
          if (!termsPanel) return;
          const saved =
            termsPanel.mode === "create"
              ? addCardToOffering(termsPanel.card, terms)
              : updateOfferingTermsAndSync(termsPanel.card.id, terms);
          if (saved) setTermsPanel(null);
        }}
      />

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
  const titleId = useId();
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="ui-glass-strong flex items-center justify-between gap-3 border-x-0 border-t-0 px-4 py-3">
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
          <h2 id={titleId} className="truncate font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-text)]">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="ui-tool-btn"
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
