import type { NationalSpecies } from "./types";

const SUFFIX_RE =
  /\s+(ex|EX|gx|GX|v|V|vmax|VMAX|vstar|VSTAR|lv\.?\s*x|LV\.?\s*X|δ)$/i;
const MEGA_RE = /^mega\s+/i;
const SPACE_RE = /\s+/g;

export function spriteUrlForDexId(dexId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexId}.png`;
}

export function normalizePokemonCardName(name: string): string {
  return name
    .trim()
    .replace(MEGA_RE, "")
    .replace(SUFFIX_RE, "")
    .replace(SPACE_RE, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

/** Best-effort: carta sem `dexId` → espécie por nome normalizado. */
export function matchDexIdsByCardName(
  cardName: string,
  species: NationalSpecies[],
): number[] {
  const needle = normalizePokemonCardName(cardName);
  if (!needle) return [];
  return species
    .filter((s) => {
      const en = normalizePokemonCardName(s.nameEn);
      const display = normalizePokemonCardName(s.name);
      return en === needle || display === needle;
    })
    .map((s) => s.dexId);
}
