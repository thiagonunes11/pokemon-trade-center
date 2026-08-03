const API_BASE_URL = "https://api.pokemontcg.io/v2";
const PAGE_SIZE = 250;

export type PokemonTcgSet = {
  id: string;
  name: string;
  series: string;
  total: number;
  images?: {
    symbol?: string;
    logo?: string;
  };
};

export type PokemonTcgCard = {
  id: string;
  name: string;
  number: string;
  supertype?: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  abilities?: Array<{
    name: string;
    type: string;
    text: string;
  }>;
  attacks?: Array<{
    name: string;
    cost?: string[];
    damage?: string;
    text?: string;
  }>;
  weaknesses?: Array<{ type: string; value?: string }>;
  resistances?: Array<{ type: string; value?: string }>;
  retreatCost?: string[];
  rarity?: string;
  artist?: string;
  flavorText?: string;
  images?: {
    small?: string;
    large?: string;
  };
  set: PokemonTcgSet;
};

type ApiListResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
};

let setsPromise: Promise<PokemonTcgSet[]> | null = null;
const cardsBySet = new Map<string, Promise<PokemonTcgCard[]>>();
const matchedSets = new Map<string, Promise<PokemonTcgSet | null>>();

async function fetchApiList<T>(
  path: string,
  params: URLSearchParams,
): Promise<ApiListResponse<T>> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 8_000);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/${path}?${params}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Error(`Pokemon TCG API ${response.status}`);
  }
  return (await response.json()) as ApiListResponse<T>;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/gi, "")
    .toLowerCase();
}

function probableSetIds(setId: string): string[] {
  const ids = [setId];
  const scarletViolet = setId.match(/^sv0?(\d+)(?:\.5)?$/i);
  if (scarletViolet) {
    ids.push(
      `sv${Number(scarletViolet[1])}${setId.includes(".5") ? "pt5" : ""}`,
    );
  }
  return [...new Set(ids)];
}

export function normalizePokemonTcgCardNumber(value: string): string {
  const compact = value.replace(/\s+/g, "").toLowerCase();
  const match = compact.match(/^([^0-9]*)(\d+)(.*)$/);
  if (!match) return compact;
  return `${match[1]}${Number(match[2])}${match[3]}`;
}

export async function fetchPokemonTcgSets(): Promise<PokemonTcgSet[]> {
  if (!setsPromise) {
    setsPromise = (async () => {
      try {
        const payload = await fetchApiList<PokemonTcgSet>(
          "sets",
          new URLSearchParams({
            pageSize: String(PAGE_SIZE),
            select: "id,name,series,total,images",
          }),
        );
        return payload.data;
      } catch (apiError) {
        const response = await fetch(
          "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json",
          { headers: { Accept: "application/json" } },
        );
        if (!response.ok) throw apiError;
        return (await response.json()) as PokemonTcgSet[];
      }
    })()
      .catch((error) => {
        setsPromise = null;
        throw error;
      });
  }
  return setsPromise;
}

export function findPokemonTcgSet(
  tcgdexSetId: string,
  englishSetName?: string,
): Promise<PokemonTcgSet | null> {
  const key = `${tcgdexSetId}|${englishSetName ?? ""}`;
  const cached = matchedSets.get(key);
  if (cached) return cached;

  const request = fetchPokemonTcgSets().then((sets) => {
    for (const candidate of probableSetIds(tcgdexSetId)) {
      const exact = sets.find((set) => set.id === candidate);
      if (exact) return exact;
    }
    if (englishSetName) {
      const normalizedName = normalize(englishSetName);
      const byName = sets.filter((set) => normalize(set.name) === normalizedName);
      if (byName.length === 1) return byName[0];
    }
    return null;
  });
  matchedSets.set(key, request);
  return request;
}

export function fetchPokemonTcgCardsForSet(
  pokemonTcgSetId: string,
): Promise<PokemonTcgCard[]> {
  const cached = cardsBySet.get(pokemonTcgSetId);
  if (cached) return cached;

  const request = (async () => {
    try {
      const cards: PokemonTcgCard[] = [];
      let page = 1;
      let totalCount = Number.POSITIVE_INFINITY;

      while (cards.length < totalCount) {
        const payload = await fetchApiList<PokemonTcgCard>(
          "cards",
          new URLSearchParams({
            q: `set.id:${pokemonTcgSetId}`,
            page: String(page),
            pageSize: String(PAGE_SIZE),
            select:
              "id,name,number,supertype,subtypes,hp,types,abilities,attacks,weaknesses,resistances,retreatCost,rarity,artist,flavorText,images,set",
          }),
        );
        cards.push(...payload.data);
        totalCount = payload.totalCount;
        if (payload.count === 0) break;
        page += 1;
      }
      return cards;
    } catch (apiError) {
      const response = await fetch(
        `https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/${encodeURIComponent(pokemonTcgSetId)}.json`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw apiError;
      const rawCards = (await response.json()) as Array<
        Omit<PokemonTcgCard, "set"> & { set?: PokemonTcgSet }
      >;
      const set = (await fetchPokemonTcgSets()).find(
        (item) => item.id === pokemonTcgSetId,
      );
      if (!set) throw apiError;
      return rawCards.map((card) => ({ ...card, set: card.set ?? set }));
    }
  })().catch((error) => {
    cardsBySet.delete(pokemonTcgSetId);
    throw error;
  });

  cardsBySet.set(pokemonTcgSetId, request);
  return request;
}

export function findPokemonTcgCard(
  cards: PokemonTcgCard[],
  localId: string | number,
): PokemonTcgCard | null {
  const number = normalizePokemonTcgCardNumber(String(localId));
  return (
    cards.find(
      (card) => normalizePokemonTcgCardNumber(card.number) === number,
    ) ?? null
  );
}
