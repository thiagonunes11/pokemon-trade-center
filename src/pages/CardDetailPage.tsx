import { BackButton } from "@/components/BackButton";
import { EnergyIconRow } from "@/components/EnergyIcon";
import { HoloTiltCard } from "@/components/HoloTiltCard";
import { IconStar } from "@/components/IconStar";
import {
  addCardToCollection,
  removeCardFromCollection,
  setCardInShowcase,
} from "@/features/collection";
import { useCard, useSetCards } from "@/features/cards";
import { compareByLocalId } from "@/lib/cardOrder";
import { resolveCardImageUrl, resolveDisplayCardImageUrl } from "@/lib/cardImages";
import {
  ligaPokemonSearchUrl,
  mypCardsSearchUrl,
} from "@/lib/externalCardLinks";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

/**
 * Detalhe da carta — efeito 3D (Aceternity / 21st.dev) + painéis glass.
 */

function setIdFromCardId(cardId: string): string {
  const i = cardId.lastIndexOf("-");
  return i > 0 ? cardId.slice(0, i) : "";
}

export function CardDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: card, isLoading, error } = useCard(id);
  const setIdForList = card?.set?.id ?? setIdFromCardId(id);
  const { data: setData } = useSetCards(setIdForList);
  const userId = useAuthStore((s) => s.userId);

  const neighbors = useMemo(() => {
    const raw = setData?.cards;
    if (!raw?.length) return null;
    const sorted = [...raw]
      .map((c) => ({
        id: c.id,
        localId: String(c.localId),
        name: c.name,
        setId: setIdForList,
      }))
      .sort(compareByLocalId);
    const index = sorted.findIndex((c) => c.id === id);
    if (index < 0) return null;
    return {
      index,
      total: sorted.length,
      prev: index > 0 ? sorted[index - 1] : null,
      next: index < sorted.length - 1 ? sorted[index + 1] : null,
    };
  }, [setData?.cards, id, setIdForList]);

  useEffect(() => {
    if (!neighbors) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft" && neighbors.prev) {
        e.preventDefault();
        navigate(`/card/${neighbors.prev.id}`, { replace: true });
      } else if (e.key === "ArrowRight" && neighbors.next) {
        e.preventDefault();
        navigate(`/card/${neighbors.next.id}`, { replace: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [neighbors, navigate]);
  const isInCollection = useCollectionStore((s) =>
    s.cards.some(
      (c) => c.id === id && (c.ownerId ?? null) === (userId ?? null),
    ),
  );
  const inShowcase = useCollectionStore((s) =>
    s.cards.some(
      (c) =>
        c.id === id &&
        (c.ownerId ?? null) === (userId ?? null) &&
        Boolean(c.inShowcase),
    ),
  );
  const [wantedClearHint, setWantedClearHint] = useState(false);

  useEffect(() => {
    setWantedClearHint(false);
  }, [id]);

  const handleToggle = () => {
    if (!card) return;
    if (isInCollection) {
      removeCardFromCollection(id);
      setWantedClearHint(false);
    } else {
      const { removedFromWanted } = addCardToCollection({
        id,
        name: card.name,
        imageUrl: resolveCardImageUrl(card.image, "high", card.imageHigh),
        setId: card.set?.id ?? id.split("-")[0],
      });
      setWantedClearHint(removedFromWanted);
    }
  };

  const handleShowcaseToggle = () => {
    if (!isInCollection) return;
    setCardInShowcase(id, !inShowcase);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-11 w-24 animate-pulse rounded-xl bg-[var(--color-bg-elevated)]" />
        <div className="grid gap-8 md:grid-cols-[minmax(220px,320px)_1fr]">
          <div className="mx-auto aspect-[0.72] w-full max-w-[320px] animate-pulse rounded-2xl bg-[var(--color-bg-elevated)]" />
          <div className="space-y-4">
            <div className="h-9 w-2/3 animate-pulse rounded-lg bg-[var(--color-bg-elevated)]" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
            <div className="h-12 animate-pulse rounded-xl bg-[var(--color-bg-elevated)]" />
            <div className="h-24 animate-pulse rounded-xl bg-[var(--color-bg-elevated)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="ui-glass space-y-4 rounded-2xl p-6">
        <p className="text-[var(--color-error)]">Carta não encontrada</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 text-sm font-semibold text-[var(--color-text)]"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  const imageUrl = resolveDisplayCardImageUrl(card.image, "high", card.imageHigh);
  const types = (card.types ?? []) as string[];
  const abilities = (card.abilities ?? []) as Array<{
    name: string;
    type?: string;
    effect?: string;
  }>;
  const attacks = (card.attacks ?? []) as Array<{
    name: string;
    damage?: string | number;
    effect?: string;
    cost?: string[];
  }>;
  const weaknesses = (card.weaknesses ?? []) as Array<{
    type: string;
    value?: string;
  }>;
  const resistances = (card.resistances ?? []) as Array<{
    type: string;
    value?: string;
  }>;
  const setId = card.set?.id;
  const setName = card.set?.name ?? null;
  const rarity =
    typeof card.rarity === "string" &&
    card.rarity.trim() &&
    !/^none$/i.test(card.rarity.trim())
      ? card.rarity
      : null;
  const stage =
    typeof card.stage === "string" && card.stage.trim()
      ? card.stage
      : null;

  const goTo = (cardId: string) => {
    navigate(`/card/${cardId}`, { replace: true });
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton to={setId ? `/catalog/${setId}` : "/catalog"}>
          Voltar
        </BackButton>
        {neighbors ? (
          <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-muted)]">
            {neighbors.index + 1} / {neighbors.total}
          </p>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(240px,340px)_1fr] lg:items-start">
        {/* Carta com efeito 3D (Aceternity / 21st.dev) */}
        <div className="mx-auto w-full max-w-[340px]">
          <div className="relative">
            {neighbors?.prev ? (
              <button
                type="button"
                onClick={() => goTo(neighbors.prev!.id)}
                aria-label={`Carta anterior: ${neighbors.prev.name}`}
                className="absolute top-1/2 left-0 z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)]/95 text-lg font-bold text-[var(--color-text)] shadow-lg backdrop-blur-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] sm:-translate-x-3"
              >
                ‹
              </button>
            ) : null}
            {neighbors?.next ? (
              <button
                type="button"
                onClick={() => goTo(neighbors.next!.id)}
                aria-label={`Próxima carta: ${neighbors.next.name}`}
                className="absolute top-1/2 right-0 z-10 flex h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)]/95 text-lg font-bold text-[var(--color-text)] shadow-lg backdrop-blur-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] sm:translate-x-3"
              >
                ›
              </button>
            ) : null}

            <HoloTiltCard src={imageUrl} alt={card.name} />
          </div>

          {(isInCollection || inShowcase) && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {isInCollection ? (
                <span className="rounded-full border border-[var(--color-success)]/40 bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-success)]">
                  Na coleção
                </span>
              ) : null}
              {inShowcase ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-accent)]/50 bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-accent)]">
                  <IconStar className="h-3 w-3" filled />
                  Vitrine
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <header className="ui-glass space-y-3 rounded-2xl p-4 sm:p-5">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
                {card.name}
              </h1>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-text-muted)]">
                {card.id}
                {card.hp != null ? ` · PS ${card.hp}` : ""}
              </p>
              {card.usesPokemonTcgImage ? (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Imagem complementada pela Pokémon TCG API.
                </p>
              ) : card.usesTcgdexCdnImage ? (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Imagem recuperada do CDN da TCGdex.
                </p>
              ) : card.usesEnglishImage ? (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Imagem complementada pelo catálogo internacional.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {setId && setName ? (
                <Link
                  to={`/catalog/${setId}`}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  {setName}
                </Link>
              ) : null}
              {stage ? (
                <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                  {stage}
                </span>
              ) : null}
              {rarity ? (
                <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                  {rarity}
                </span>
              ) : null}
              {types.length > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1">
                  <span className="text-[11px] font-semibold tracking-wide text-[var(--color-text-muted)] uppercase">
                    Tipo
                  </span>
                  <EnergyIconRow types={types} size={20} />
                </span>
              ) : null}
            </div>
          </header>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleToggle}
              className={
                isInCollection
                  ? "min-h-12 flex-1 rounded-xl border border-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)] px-4 text-sm font-bold text-[var(--color-error)] transition hover:bg-[color-mix(in_srgb,var(--color-error)_20%,transparent)]"
                  : "ui-btn-accent min-h-12 flex-1 px-4 text-sm"
              }
            >
              {isInCollection ? "Remover da coleção" : "Adicionar à coleção"}
            </button>
            {isInCollection ? (
              <button
                type="button"
                onClick={handleShowcaseToggle}
                className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${
                  inShowcase
                    ? "ui-btn-accent border-transparent"
                    : "border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text)] hover:border-[var(--color-accent)]"
                }`}
              >
                <IconStar className="h-4 w-4" filled={inShowcase} />
                {inShowcase ? "Na vitrine" : "Adicionar à vitrine"}
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={ligaPokemonSearchUrl(card.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-tool-btn"
            >
              Liga Pokémon
            </a>
            <a
              href={mypCardsSearchUrl(card.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-tool-btn"
            >
              MYP Cards
            </a>
          </div>

          {wantedClearHint ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Removida da lista de procura.{" "}
              <Link
                to="/trades?tab=wanted"
                className="font-semibold text-[var(--color-accent)] hover:underline"
              >
                Ver busca
              </Link>
            </p>
          ) : null}

          {typeof card.description === "string" && card.description.trim() ? (
            <section className="ui-glass space-y-2 rounded-2xl p-3.5">
              <h2 className="text-xs font-semibold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                Descrição
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {card.description.trim()}
              </p>
              {typeof card.illustrator === "string" &&
              card.illustrator.trim() ? (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Ilustrador: {card.illustrator.trim()}
                </p>
              ) : null}
            </section>
          ) : typeof card.illustrator === "string" &&
            card.illustrator.trim() ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              Ilustrador: {card.illustrator.trim()}
            </p>
          ) : null}

          {abilities.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                Habilidades
              </h2>
              <div className="space-y-2">
                {abilities.map((ability) => (
                  <div
                    key={`${ability.type ?? "ability"}-${ability.name}`}
                    className="ui-glass rounded-2xl p-3.5 transition hover:border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-border))]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {ability.type ? (
                        <span className="rounded-md bg-[var(--color-bg-elevated)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[var(--color-accent)] uppercase">
                          {ability.type}
                        </span>
                      ) : null}
                      <span className="font-semibold text-[var(--color-text)]">
                        {ability.name}
                      </span>
                    </div>
                    {ability.effect ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {ability.effect}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {attacks.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                Ataques
              </h2>
              <div className="space-y-2">
                {attacks.map((atk) => (
                  <div
                    key={atk.name}
                    className="ui-glass rounded-2xl p-3.5 transition hover:border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-border))]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {atk.cost && atk.cost.length > 0 ? (
                            <EnergyIconRow types={atk.cost} size={16} />
                          ) : null}
                          <span className="font-semibold text-[var(--color-text)]">
                            {atk.name}
                          </span>
                        </div>
                        {atk.effect ? (
                          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                            {atk.effect}
                          </p>
                        ) : null}
                      </div>
                      {atk.damage != null && atk.damage !== "" ? (
                        <span className="shrink-0 rounded-lg bg-[var(--color-bg-elevated)] px-2.5 py-1 font-[family-name:var(--font-mono)] text-sm font-bold text-[var(--color-accent)]">
                          {atk.damage}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(weaknesses.length > 0 || resistances.length > 0) && (
            <section className="grid gap-3 sm:grid-cols-2">
              {weaknesses.length > 0 && (
                <div className="ui-glass rounded-2xl p-3.5">
                  <h3 className="text-[11px] font-semibold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
                    Fraqueza
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <EnergyIconRow
                      types={weaknesses.map((w) => w.type)}
                      size={18}
                    />
                    <span className="font-semibold text-[var(--color-text)]">
                      {weaknesses.map((w) => w.value).filter(Boolean).join(" ") ||
                        "—"}
                    </span>
                  </div>
                </div>
              )}
              {resistances.length > 0 && (
                <div className="ui-glass rounded-2xl p-3.5">
                  <h3 className="text-[11px] font-semibold tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
                    Resistência
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <EnergyIconRow
                      types={resistances.map((r) => r.type)}
                      size={18}
                    />
                    <span className="font-semibold text-[var(--color-text)]">
                      {resistances
                        .map((r) => r.value)
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </span>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
