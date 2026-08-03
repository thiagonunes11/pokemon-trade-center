const TCGDEX_ASSETS_ORIGIN = "https://assets.tcgdex.net";

/** Variantes de localId a tentar no path do CDN (ordem importa). */
export function tcgdexLocalIdCandidates(localId: string): string[] {
  const raw = localId.trim();
  if (!raw) return [];
  const candidates = [raw];
  if (/^\d+$/.test(raw)) {
    const asNumber = String(Number(raw));
    const padded = asNumber.padStart(3, "0");
    for (const value of [padded, asNumber]) {
      if (!candidates.includes(value)) candidates.push(value);
    }
  }
  return candidates;
}

/**
 * Monta URL-base do asset TCGdex (sem /low.webp).
 * Locale fixo `en` nesta fatia — assets PT costumam faltar quando a API omite `image`.
 */
export function buildTcgdexAssetBaseUrl(
  seriesId: string,
  setId: string,
  localIdCandidate: string,
  lang: "en" | "pt" = "en",
): string {
  const series = encodeURIComponent(seriesId);
  const set = encodeURIComponent(setId);
  const local = encodeURIComponent(localIdCandidate);
  return `${TCGDEX_ASSETS_ORIGIN}/${lang}/${series}/${set}/${local}`;
}

export function tcgdexAssetProbeUrl(baseUrl: string): string {
  return `${baseUrl}/low.webp`;
}

export function listTcgdexAssetBaseCandidates(
  seriesId: string,
  setId: string,
  localId: string,
): string[] {
  if (!seriesId || !setId) return [];
  return tcgdexLocalIdCandidates(localId).map((candidate) =>
    buildTcgdexAssetBaseUrl(seriesId, setId, candidate),
  );
}

/** URL-base de logo/símbolo do set (sem `.webp`). */
export function buildTcgdexSetBrandBaseUrl(
  seriesId: string,
  setId: string,
  kind: "logo" | "symbol",
  lang: "en" | "pt" | "univ" = "en",
): string {
  const series = encodeURIComponent(seriesId);
  const set = encodeURIComponent(setId);
  return `${TCGDEX_ASSETS_ORIGIN}/${lang}/${series}/${set}/${kind}`;
}
