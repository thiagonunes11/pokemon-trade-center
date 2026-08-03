import TCGdex, { Query } from "@tcgdex/sdk";

import {
  fetchPokemonTcgCardsForSet,
  findPokemonTcgCard,
  findPokemonTcgSet,
  type PokemonTcgCard,
} from "@/lib/pokemonTcgApi";

export const tcgdexPt = new TCGdex("pt");
export const tcgdexEn = new TCGdex("en");

/** Mantido como export default para integrações existentes. */
export default tcgdexPt;

export const CATALOG_DEFAULT_SERIES_ID = "me";

type TCGdexSet = NonNullable<
  Awaited<ReturnType<(typeof tcgdexPt.set)["get"]>>
>;
type TCGdexCard = NonNullable<
  Awaited<ReturnType<(typeof tcgdexPt.card)["get"]>>
>;
type TCGdexCardResume = TCGdexSet["cards"][number];

export type CatalogCardResume = TCGdexCardResume & {
  imageHigh?: string;
  imageSource?: "tcgdex-pt" | "tcgdex-en" | "pokemontcg";
};

export type CatalogContentLanguage = "pt" | "mixed" | "en";

export type CatalogSeries = {
  id: string;
  name: string;
  logoUrl: string | null;
};

export type CatalogSetSummary = {
  id: string;
  name: string;
  seriesId: string;
  seriesName: string;
  subtitle: string;
  logoUrl: string | null;
  symbolUrl: string | null;
  cardCount: {
    total: number;
    official: number;
  };
  isPromo: boolean;
};

export type CatalogCardSearchResult = {
  id: string;
  localId: string;
  name: string;
  image: string | null;
  setId: string;
  setName: string;
};

export type CatalogSet = Omit<TCGdexSet, "cards"> & {
  cards: CatalogCardResume[];
  contentLanguage: CatalogContentLanguage;
  englishImageCount: number;
  pokemonTcgImageCount: number;
  missingImageCount: number;
};

export type CatalogCard = TCGdexCard & {
  contentLanguage: "pt" | "en";
  usesEnglishImage: boolean;
  imageHigh?: string;
  usesPokemonTcgImage: boolean;
};

function settledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

function throwIfBothFailed(
  first: PromiseSettledResult<unknown>,
  second: PromiseSettledResult<unknown>,
): void {
  if (first.status === "rejected" && second.status === "rejected") {
    throw first.reason;
  }
}

function isPromoSet(id: string, name: string): boolean {
  return /promo/i.test(name) || /p$/i.test(id);
}

function assetImageUrl(value: string | undefined): string | null {
  if (!value) return null;
  return /\.(?:webp|png|jpe?g)$/i.test(value) ? value : `${value}.webp`;
}

function setIdFromCardId(cardId: string): string {
  const separator = cardId.lastIndexOf("-");
  return separator > 0 ? cardId.slice(0, separator) : "";
}

function isPhysicalCard(image: string | undefined): boolean {
  return !image?.includes("/tcgp/");
}

/**
 * Busca cartas em todo o catálogo físico sem carregar cada expansão. A API
 * filtra por nome e os resultados em português têm prioridade sobre o inglês.
 */
export async function searchCatalogCards(
  search: string,
): Promise<CatalogCardSearchResult[]> {
  const normalizedSearch = search.trim();
  if (normalizedSearch.length < 2) return [];

  const makeQuery = () => Query.create().contains("name", normalizedSearch);
  const [ptCardsResult, enCardsResult, ptSetsResult, enSetsResult] =
    await Promise.allSettled([
      tcgdexPt.card.list(makeQuery()),
      tcgdexEn.card.list(makeQuery()),
      tcgdexPt.set.list(),
      tcgdexEn.set.list(),
    ]);

  throwIfBothFailed(ptCardsResult, enCardsResult);
  const ptCards = settledValue(ptCardsResult) ?? [];
  const enCards = settledValue(enCardsResult) ?? [];
  const ptSets = settledValue(ptSetsResult) ?? [];
  const enSets = settledValue(enSetsResult) ?? [];
  const ptById = new Map(ptCards.map((card) => [card.id, card]));
  const enById = new Map(enCards.map((card) => [card.id, card]));
  const setNames = new Map(enSets.map((set) => [set.id, set.name]));
  for (const set of ptSets) setNames.set(set.id, set.name);

  return [...new Set([...enById.keys(), ...ptById.keys()])]
    .map((id) => {
      const pt = ptById.get(id);
      const en = enById.get(id);
      const image = pt?.image ?? en?.image;
      const setId = setIdFromCardId(id);
      return {
        id,
        localId: String(pt?.localId ?? en?.localId ?? ""),
        name: pt?.name ?? en?.name ?? id,
        image: image ?? null,
        setId,
        setName: setNames.get(setId) ?? setId.toUpperCase(),
      };
    })
    .filter((card) => isPhysicalCard(card.image ?? undefined));
}

function localIdFromCardId(cardId: string, setId: string): string {
  return cardId.startsWith(`${setId}-`)
    ? cardId.slice(setId.length + 1)
    : cardId.slice(cardId.lastIndexOf("-") + 1);
}

function pokemonTcgCardFields(
  card: PokemonTcgCard,
  canonicalCardId: string,
  canonicalSetId: string,
) {
  const hp = card.hp ? Number.parseInt(card.hp, 10) : undefined;
  return {
    id: canonicalCardId,
    localId: localIdFromCardId(canonicalCardId, canonicalSetId),
    name: card.name,
    image: card.images?.large ?? card.images?.small,
    imageHigh: card.images?.large,
    illustrator: card.artist,
    rarity: card.rarity ?? "",
    category: card.supertype ?? "",
    stage: card.subtypes?.[0],
    hp: Number.isFinite(hp) ? hp : undefined,
    types: card.types,
    abilities: card.abilities?.map((ability) => ({
      name: ability.name,
      type: ability.type,
      effect: ability.text,
    })),
    attacks: card.attacks?.map((attack) => ({
      name: attack.name,
      cost: attack.cost,
      damage: attack.damage,
      effect: attack.text,
    })),
    weaknesses: card.weaknesses,
    resistances: card.resistances,
    retreat: card.retreatCost?.length,
    description: card.flavorText,
    set: {
      id: canonicalSetId,
      name: card.set.name,
      logo: card.set.images?.logo,
      symbol: card.set.images?.symbol,
      cardCount: {
        total: card.set.total,
        official: card.set.total,
      },
    },
  };
}

async function pokemonTcgFallbackForSet(
  setId: string,
  englishSetName?: string,
): Promise<PokemonTcgCard[]> {
  try {
    const set = await findPokemonTcgSet(setId, englishSetName);
    return set ? await fetchPokemonTcgCardsForSet(set.id) : [];
  } catch (error) {
    console.warn("[PokemonTCG] fallback indisponível", error);
    return [];
  }
}

/** Lista leve de séries; Pokémon Pocket fica fora do catálogo físico. */
export async function fetchCatalogSeries(): Promise<CatalogSeries[]> {
  const [ptResult, enResult] = await Promise.allSettled([
    tcgdexPt.serie.list(),
    tcgdexEn.serie.list(),
  ]);
  throwIfBothFailed(ptResult, enResult);

  const ptSeries = settledValue(ptResult) ?? [];
  const enSeries = settledValue(enResult) ?? [];
  const ptById = new Map(ptSeries.map((serie) => [serie.id, serie]));
  const enById = new Map(enSeries.map((serie) => [serie.id, serie]));
  const ids = [...new Set([...enById.keys(), ...ptById.keys()])].filter(
    (id) => id !== "tcgp",
  );

  return ids
    .map((id) => {
      const pt = ptById.get(id);
      const en = enById.get(id);
      return {
        id,
        name: pt?.name ?? en?.name ?? id,
        logoUrl: assetImageUrl(pt?.logo ?? en?.logo),
      };
    })
    .reverse();
}

/** Expansões de uma série, unindo sets ausentes no locale português. */
export async function fetchSeriesSets(
  seriesId: string,
): Promise<CatalogSetSummary[]> {
  if (!seriesId) return [];
  const [ptResult, enResult] = await Promise.allSettled([
    tcgdexPt.serie.get(seriesId),
    tcgdexEn.serie.get(seriesId),
  ]);
  throwIfBothFailed(ptResult, enResult);

  const ptSerie = settledValue(ptResult);
  const enSerie = settledValue(enResult);
  if (!ptSerie && !enSerie) throw new Error(`Serie ${seriesId} not found`);

  const ptSets = ptSerie?.sets ?? [];
  const enSets = enSerie?.sets ?? [];
  const ptById = new Map(ptSets.map((set) => [set.id, set]));
  const enById = new Map(enSets.map((set) => [set.id, set]));
  const ids = [...new Set([...enById.keys(), ...ptById.keys()])];
  const seriesName = ptSerie?.name ?? enSerie?.name ?? seriesId;

  return ids.map((id) => {
    const pt = ptById.get(id);
    const en = enById.get(id);
    const name = pt?.name ?? en?.name ?? id;
    return {
      id,
      name,
      seriesId,
      seriesName,
      subtitle: isPromoSet(id, name) ? `${seriesName} · Promos` : seriesName,
      logoUrl: assetImageUrl(pt?.logo ?? en?.logo),
      symbolUrl: assetImageUrl(pt?.symbol ?? en?.symbol),
      cardCount: {
        total: Math.max(
          pt?.cardCount.total ?? 0,
          en?.cardCount.total ?? 0,
        ),
        official: Math.max(
          pt?.cardCount.official ?? 0,
          en?.cardCount.official ?? 0,
        ),
      },
      isPromo: isPromoSet(id, name),
    };
  });
}

/**
 * Carrega um set sob demanda. Textos em português têm prioridade e imagens ou
 * cartas ausentes são complementadas pelo mesmo ID no catálogo inglês.
 */
export async function fetchSetWithFallback(
  setId: string,
  options: { includePokemonTcg?: boolean } = {},
): Promise<CatalogSet> {
  const [ptResult, enResult] = await Promise.allSettled([
    tcgdexPt.set.get(setId),
    tcgdexEn.set.get(setId),
  ]);
  throwIfBothFailed(ptResult, enResult);

  const ptSet = settledValue(ptResult);
  const enSet = settledValue(enResult);
  if (!ptSet && !enSet) throw new Error(`Set ${setId} not found`);

  const ptCards = ptSet?.cards ?? [];
  const enCards = enSet?.cards ?? [];
  const ptById = new Map(ptCards.map((card) => [card.id, card]));
  const enById = new Map(enCards.map((card) => [card.id, card]));
  const ids = [...new Set([...enById.keys(), ...ptById.keys()])];
  let englishImageCount = 0;

  let cards = ids.map((id) => {
    const pt = ptById.get(id);
    const en = enById.get(id);
    const usesEnglishImage = !pt?.image && Boolean(en?.image);
    if (usesEnglishImage) englishImageCount += 1;
    return {
      ...(en ?? {}),
      ...(pt ?? {}),
      image: pt?.image ?? en?.image,
      imageSource: pt?.image
        ? "tcgdex-pt"
        : en?.image
          ? "tcgdex-en"
          : undefined,
    } as CatalogCardResume;
  });

  let pokemonTcgImageCount = 0;
  if (
    options.includePokemonTcg !== false &&
    cards.some((card) => !card.image)
  ) {
    const pokemonCards = await pokemonTcgFallbackForSet(setId, enSet?.name);
    if (pokemonCards.length > 0) {
      cards = cards.map((card) => {
        if (card.image) return card;
        const fallback = findPokemonTcgCard(pokemonCards, card.localId);
        const image = fallback?.images?.small ?? fallback?.images?.large;
        if (!image) return card;
        pokemonTcgImageCount += 1;
        return {
          ...card,
          image,
          imageHigh: fallback?.images?.large,
          imageSource: "pokemontcg",
        } as CatalogCardResume;
      });
    }
  }

  const fallbackCardCount = cards.filter((card) => !ptById.has(card.id)).length;
  const contentLanguage: CatalogContentLanguage =
    ptCards.length === 0
      ? "en"
      : fallbackCardCount > 0
        ? "mixed"
        : "pt";
  const base = ptSet ?? enSet!;
  const total = Math.max(
    cards.length,
    ptSet?.cardCount.total ?? 0,
    enSet?.cardCount.total ?? 0,
  );

  return {
    ...(enSet ?? {}),
    ...(ptSet ?? {}),
    id: base.id,
    name: ptSet?.name ?? enSet?.name ?? setId,
    logo: assetImageUrl(ptSet?.logo ?? enSet?.logo) ?? undefined,
    symbol: assetImageUrl(ptSet?.symbol ?? enSet?.symbol) ?? undefined,
    serie: ptSet?.serie ?? enSet!.serie,
    cardCount: {
      ...(enSet?.cardCount ?? base.cardCount),
      ...(ptSet?.cardCount ?? {}),
      total,
      official: Math.max(
        ptSet?.cardCount.official ?? 0,
        enSet?.cardCount.official ?? 0,
      ),
    },
    cards,
    contentLanguage,
    englishImageCount,
    pokemonTcgImageCount,
    missingImageCount: cards.filter((card) => !card.image).length,
  } as CatalogSet;
}

/** Detalhe compatível com links diretos de cartas antigas. */
export async function fetchCardWithFallback(
  cardId: string,
): Promise<CatalogCard> {
  const [ptResult, enResult] = await Promise.allSettled([
    tcgdexPt.card.get(cardId),
    tcgdexEn.card.get(cardId),
  ]);
  throwIfBothFailed(ptResult, enResult);

  const ptCard = settledValue(ptResult);
  const enCard = settledValue(enResult);
  const setId = ptCard?.set?.id ?? enCard?.set?.id ?? setIdFromCardId(cardId);
  let pokemonCard: PokemonTcgCard | null = null;

  if ((!ptCard && !enCard) || (!ptCard?.image && !enCard?.image)) {
    const pokemonCards = await pokemonTcgFallbackForSet(setId, enCard?.set?.name);
    pokemonCard = findPokemonTcgCard(
      pokemonCards,
      localIdFromCardId(cardId, setId),
    );
  }

  if (!ptCard && !enCard && !pokemonCard) {
    throw new Error(`Card ${cardId} not found`);
  }

  const pokemonFields = pokemonCard
    ? pokemonTcgCardFields(pokemonCard, cardId, setId)
    : {};
  const pokemonSet = "set" in pokemonFields ? pokemonFields.set : undefined;
  const pokemonImage = pokemonCard?.images?.large ?? pokemonCard?.images?.small;

  return {
    ...pokemonFields,
    ...(enCard ?? {}),
    ...(ptCard ?? {}),
    image: ptCard?.image ?? enCard?.image ?? pokemonImage,
    imageHigh: pokemonCard?.images?.large,
    set: ptCard?.set ?? enCard?.set ?? pokemonSet,
    contentLanguage: ptCard ? "pt" : "en",
    usesEnglishImage: !ptCard?.image && Boolean(enCard?.image),
    usesPokemonTcgImage:
      !ptCard?.image && !enCard?.image && Boolean(pokemonImage),
  } as CatalogCard;
}
