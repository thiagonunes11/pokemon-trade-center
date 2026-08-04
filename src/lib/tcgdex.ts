import TCGdex, { Query } from "@tcgdex/sdk";

import {
  fillMissingImagesFromTcgdexCdn,
  resolveTcgdexCdnImageBase,
} from "@/lib/tcgdexAssetProbe";
import { buildTcgdexSetBrandBaseUrl } from "@/lib/tcgdexAssetUrl";
import { firstReachableImageUrl, isReachableImageUrl } from "@/lib/cardImages";
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
  imageSource?: "tcgdex-pt" | "tcgdex-en" | "tcgdex-cdn" | "pokemontcg";
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
  cdnImageCount: number;
  pokemonTcgImageCount: number;
  missingImageCount: number;
};

export type CatalogCard = TCGdexCard & {
  contentLanguage: "pt" | "en";
  usesEnglishImage: boolean;
  imageHigh?: string;
  usesTcgdexCdnImage: boolean;
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

/** Expansões só de energia básica (sem logo/artes úteis no catálogo). */
export function isEnergySet(setId: string, name?: string): boolean {
  if (/^(mee|sve)$/i.test(setId)) return true;
  return Boolean(name && /energ/i.test(name));
}

/**
 * Sets de produto/deck sem arte útil na TCGdex nem na Pokémon TCG
 * (ex.: My First Battle). Ficam fora do catálogo de coleção/troca.
 */
export function isExcludedCatalogSet(setId: string, name?: string): boolean {
  if (isEnergySet(setId, name)) return true;
  if (/^mfb$/i.test(setId)) return true;
  return Boolean(name && /my first battle/i.test(name));
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
 * Imagens ausentes na TCGdex são complementadas via Pokémon TCG por set (cache).
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

  let results = [...new Set([...enById.keys(), ...ptById.keys()])]
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
    .filter(
      (card) =>
        isPhysicalCard(card.image ?? undefined) &&
        !isExcludedCatalogSet(card.setId, card.setName),
    );

  const missingBySet = new Map<string, typeof results>();
  for (const card of results) {
    if (card.image) continue;
    const list = missingBySet.get(card.setId) ?? [];
    list.push(card);
    missingBySet.set(card.setId, list);
  }

  if (missingBySet.size > 0) {
    const imageByCardId = new Map<string, string>();
    const setEntries = [...missingBySet.entries()];
    const concurrency = 4;
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(concurrency, setEntries.length) }, async () => {
        while (next < setEntries.length) {
          const index = next++;
          const [setId, cards] = setEntries[index];
          const pokemonCards = await pokemonTcgFallbackForSet(
            setId,
            cards[0]?.setName,
          );
          for (const card of cards) {
            const hit = findPokemonTcgCard(pokemonCards, card.localId);
            const image = await firstReachableImageUrl([
              hit?.images?.small,
              hit?.images?.large,
            ]);
            if (image) imageByCardId.set(card.id, image);
          }
        }
      }),
    );
    if (imageByCardId.size > 0) {
      results = results.map((card) =>
        card.image
          ? card
          : { ...card, image: imageByCardId.get(card.id) ?? null },
      );
    }
  }

  return results;
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

  const summaries = ids
    .map((id) => {
      const pt = ptById.get(id);
      const en = enById.get(id);
      const name = pt?.name ?? en?.name ?? id;
      return {
        id,
        name,
        seriesId,
        seriesName,
        subtitle: isPromoSet(id, name) ? `${seriesName} · Promos` : seriesName,
        apiLogo: assetImageUrl(pt?.logo ?? en?.logo),
        apiSymbol: assetImageUrl(pt?.symbol ?? en?.symbol),
        englishName: en?.name ?? name,
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
    })
    .filter((set) => !isExcludedCatalogSet(set.id, set.name));

  // Logos/símbolos ausentes na TCGdex: Pokémon TCG (ex. svp) e CDN (ex. mep/symbol).
  const brands = await Promise.all(
    summaries.map(async (set) => {
      let ptcgLogo: string | null = null;
      let ptcgSymbol: string | null = null;
      if (!set.apiLogo || !set.apiSymbol) {
        const ptcg = await findPokemonTcgSet(set.id, set.englishName).catch(
          () => null,
        );
        ptcgLogo = ptcg?.images?.logo ?? null;
        ptcgSymbol = ptcg?.images?.symbol ?? null;
      }
      const cdnSymbol = assetImageUrl(
        buildTcgdexSetBrandBaseUrl(seriesId, set.id, "symbol"),
      );
      return {
        id: set.id,
        name: set.name,
        seriesId: set.seriesId,
        seriesName: set.seriesName,
        subtitle: set.subtitle,
        // Não inventar logo CDN sem confirmação — URL 404 escondia o título.
        logoUrl: set.apiLogo ?? ptcgLogo,
        symbolUrl: set.apiSymbol ?? ptcgSymbol ?? cdnSymbol,
        cardCount: set.cardCount,
        isPromo: set.isPromo,
      } satisfies CatalogSetSummary;
    }),
  );

  return brands;
}

/**
 * Carrega um set sob demanda. Textos em português têm prioridade e imagens ou
 * cartas ausentes são complementadas pelo mesmo ID no catálogo inglês, depois
 * pelo CDN de assets quando a API omite `image`, e por fim pela Pokémon TCG API.
 */
export async function fetchSetWithFallback(
  setId: string,
  options: { includePokemonTcg?: boolean; includeCdn?: boolean } = {},
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

  const seriesId = ptSet?.serie?.id ?? enSet?.serie?.id ?? "";
  let cdnImageCount = 0;
  if (
    options.includeCdn !== false &&
    seriesId &&
    cards.some((card) => !card.image)
  ) {
    const missing = cards
      .filter((card) => !card.image)
      .map((card) => ({
        id: card.id,
        localId: String(card.localId ?? localIdFromCardId(card.id, setId)),
      }));
    const cdnBases = await fillMissingImagesFromTcgdexCdn(
      seriesId,
      setId,
      missing,
    );
    if (cdnBases.size > 0) {
      cards = cards.map((card) => {
        if (card.image) return card;
        const image = cdnBases.get(card.id);
        if (!image) return card;
        cdnImageCount += 1;
        return {
          ...card,
          image,
          imageSource: "tcgdex-cdn",
        } as CatalogCardResume;
      });
    }
  }

  let pokemonTcgImageCount = 0;
  if (
    options.includePokemonTcg !== false &&
    cards.some((card) => !card.image)
  ) {
    const pokemonCards = await pokemonTcgFallbackForSet(setId, enSet?.name);
    if (pokemonCards.length > 0) {
      const missing = cards.filter((card) => !card.image);
      const resolved = await Promise.all(
        missing.map(async (card) => {
          const fallback = findPokemonTcgCard(pokemonCards, card.localId);
          if (!fallback) return null;
          const image = await firstReachableImageUrl([
            fallback.images?.small,
            fallback.images?.large,
          ]);
          if (!image) return null;
          const imageHigh =
            fallback.images?.large &&
            (await isReachableImageUrl(fallback.images.large))
              ? fallback.images.large
              : undefined;
          return { id: card.id, image, imageHigh };
        }),
      );
      const byId = new Map(
        resolved.filter(Boolean).map((row) => [row!.id, row!] as const),
      );
      cards = cards.map((card) => {
        const hit = byId.get(card.id);
        if (!hit) return card;
        pokemonTcgImageCount += 1;
        return {
          ...card,
          image: hit.image,
          imageHigh: hit.imageHigh,
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
    cdnImageCount,
    pokemonTcgImageCount,
    missingImageCount: cards.filter((card) => !card.image).length,
  } as CatalogSet;
}

const seriesIdBySetId = new Map<string, Promise<string>>();

async function resolveSeriesIdForSet(setId: string): Promise<string> {
  if (!setId) return "";
  const cached = seriesIdBySetId.get(setId);
  if (cached) return cached;
  const request = (async () => {
    try {
      const set = await tcgdexEn.set.get(setId);
      return set?.serie?.id ?? "";
    } catch {
      try {
        const set = await tcgdexPt.set.get(setId);
        return set?.serie?.id ?? "";
      } catch {
        return "";
      }
    }
  })();
  seriesIdBySetId.set(setId, request);
  return request;
}

function isBlankCardText(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return !trimmed || /^none$/i.test(trimmed);
  }
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function pickCardField<T>(
  ...candidates: Array<T | null | undefined>
): T | undefined {
  for (const value of candidates) {
    if (!isBlankCardText(value)) return value as T;
  }
  return undefined;
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
  const localId = localIdFromCardId(cardId, setId);
  // Card.resume.set não inclui serie; resolvemos via set.get quando precisar do CDN.
  let seriesId = "";

  const apiImage = ptCard?.image ?? enCard?.image ?? null;
  if (!apiImage && setId) {
    seriesId = await resolveSeriesIdForSet(setId);
  }

  let cdnImage: string | null = null;
  if (!apiImage && seriesId && setId) {
    cdnImage = await resolveTcgdexCdnImageBase(seriesId, setId, localId);
  }

  let pokemonCard: PokemonTcgCard | null = null;
  // Busca Pokémon TCG também para enriquecer texto quando a TCGdex vem incompleta
  // (ex.: rarity "None") ou quando falta imagem.
  const needsPokemonEnrichment =
    (!apiImage && !cdnImage) ||
    isBlankCardText(ptCard?.rarity ?? enCard?.rarity) ||
    (!(ptCard?.attacks?.length || enCard?.attacks?.length));

  if (needsPokemonEnrichment && setId) {
    const pokemonCards = await pokemonTcgFallbackForSet(
      setId,
      enCard?.set?.name,
    );
    pokemonCard = findPokemonTcgCard(pokemonCards, localId);
  }

  if (!ptCard && !enCard && !cdnImage && !pokemonCard) {
    throw new Error(`Card ${cardId} not found`);
  }

  const pokemonFields = (
    pokemonCard ? pokemonTcgCardFields(pokemonCard, cardId, setId) : {}
  ) as Partial<CatalogCard> & {
    name?: string;
    rarity?: string;
    category?: string;
    stage?: string;
    attacks?: CatalogCard["attacks"];
    types?: CatalogCard["types"];
    abilities?: CatalogCard["abilities"];
    description?: string;
    illustrator?: string;
    set?: CatalogCard["set"];
  };
  const pokemonSet = pokemonFields.set;
  const pokemonImage = await firstReachableImageUrl([
    pokemonCard?.images?.small,
    pokemonCard?.images?.large,
  ]);
  const pokemonImageHigh =
    pokemonCard?.images?.large &&
    (await isReachableImageUrl(pokemonCard.images.large))
      ? pokemonCard.images.large
      : undefined;

  const merged = {
    ...pokemonFields,
    ...(enCard ?? {}),
    ...(ptCard ?? {}),
  } as CatalogCard;

  // PT tem prioridade, mas campos vazios/"None" cedem ao inglês e à Pokémon TCG.
  const name = pickCardField(ptCard?.name, enCard?.name, pokemonFields.name);
  const rarity = pickCardField(
    ptCard?.rarity,
    enCard?.rarity,
    pokemonFields.rarity,
  );
  const category = pickCardField(
    ptCard?.category,
    enCard?.category,
    pokemonFields.category,
  );
  const stage = pickCardField(
    ptCard?.stage,
    enCard?.stage,
    pokemonFields.stage,
  );
  const attacks = pickCardField(
    ptCard?.attacks,
    enCard?.attacks,
    pokemonFields.attacks,
  );
  const types = pickCardField(
    ptCard?.types,
    enCard?.types,
    pokemonFields.types,
  );
  const abilities = pickCardField(
    ptCard?.abilities,
    enCard?.abilities,
    pokemonFields.abilities,
  );
  const description = pickCardField(
    ptCard?.description,
    enCard?.description,
    pokemonFields.description,
  );
  const illustrator = pickCardField(
    ptCard?.illustrator,
    enCard?.illustrator,
    pokemonFields.illustrator,
  );

  const hasPtText = Boolean(ptCard?.name || ptCard?.attacks?.length);

  return {
    ...merged,
    name: name ?? merged.name,
    rarity: rarity ?? "",
    category: category ?? merged.category,
    stage: stage ?? merged.stage,
    attacks: attacks ?? merged.attacks,
    types: types ?? merged.types,
    abilities: abilities ?? merged.abilities,
    description: description ?? merged.description,
    illustrator: illustrator ?? merged.illustrator,
    image: apiImage ?? cdnImage ?? pokemonImage,
    // Só usa high de terceiros quando não há base TCGdex (senão o detalhe
    // preferiria Scrydex e quebrava URLs sem extensão via `/high.webp`).
    imageHigh:
      apiImage || cdnImage ? undefined : pokemonImageHigh,
    set: ptCard?.set ?? enCard?.set ?? pokemonSet,
    contentLanguage: hasPtText ? "pt" : "en",
    usesEnglishImage: !ptCard?.image && Boolean(enCard?.image),
    usesTcgdexCdnImage: !apiImage && Boolean(cdnImage),
    usesPokemonTcgImage:
      !apiImage && !cdnImage && Boolean(pokemonImage),
  } as CatalogCard;
}
