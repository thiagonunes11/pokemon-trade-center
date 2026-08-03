import { spriteUrlForDexId } from "./matchDexIds";
import type { NationalSpecies } from "./types";

const POKEAPI = "https://pokeapi.co/api/v2";

type SpeciesListItem = { name: string; url: string };
type SpeciesListResponse = {
  next: string | null;
  results: SpeciesListItem[];
};

function capitalizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function dexIdFromUrl(url: string): number | null {
  const match = url.match(/\/pokemon-species\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      out[index] = await fn(items[index]!);
    }
  }

  const workers = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return out;
}

/** Lista rápida (EN). Use `enrichNationalSpeciesPtNames` para PT em background. */
export async function fetchNationalSpecies(): Promise<NationalSpecies[]> {
  const all: SpeciesListItem[] = [];
  let url: string | null = `${POKEAPI}/pokemon-species?limit=200`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`PokéAPI species list failed: ${res.status}`);
    }
    const data = (await res.json()) as SpeciesListResponse;
    all.push(...data.results);
    url = data.next;
  }

  return all
    .map((item) => {
      const dexId = dexIdFromUrl(item.url);
      if (dexId == null) return null;
      const nameEn = capitalizeSlug(item.name);
      return {
        dexId,
        name: nameEn,
        nameEn,
        spriteUrl: spriteUrlForDexId(dexId),
      } satisfies NationalSpecies;
    })
    .filter((s): s is NationalSpecies => s != null)
    .sort((a, b) => a.dexId - b.dexId);
}

/** Enriquece `name` com pt-BR/pt quando disponível. */
export async function enrichNationalSpeciesPtNames(
  species: NationalSpecies[],
): Promise<NationalSpecies[]> {
  return mapPool(species, 40, async (entry) => {
    try {
      const res = await fetch(`${POKEAPI}/pokemon-species/${entry.dexId}`);
      if (!res.ok) return entry;
      const data = (await res.json()) as {
        names?: Array<{ name: string; language: { name: string } }>;
      };
      const pt =
        data.names?.find((n) => n.language.name === "pt-BR")?.name ??
        data.names?.find((n) => n.language.name === "pt")?.name;
      if (!pt || pt === entry.name) return entry;
      return { ...entry, name: pt };
    } catch {
      return entry;
    }
  });
}
