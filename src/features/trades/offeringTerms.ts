export type WantCardRef = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
};

export type OfferingTerms = {
  priceBRL: number | null;
  wantCards: WantCardRef[];
};

const MAX_WANT = 20;

function roundPriceBRL(price: number): number {
  return Math.round((price + Number.EPSILON) * 100) / 100;
}

export function parsePriceBRL(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(normalized)) {
    return null;
  }

  const price = Number(normalized.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(price) && price > 0 ? roundPriceBRL(price) : null;
}

export function hasValidOfferingTerms(terms: OfferingTerms): boolean {
  const priceOk =
    terms.priceBRL != null &&
    Number.isFinite(terms.priceBRL) &&
    terms.priceBRL > 0;
  const wantsOk = Array.isArray(terms.wantCards) && terms.wantCards.length > 0;
  return priceOk || wantsOk;
}

export function normalizeOfferingTerms(raw: unknown): OfferingTerms {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  let priceBRL: number | null = null;
  if (typeof obj.priceBRL === "number" && Number.isFinite(obj.priceBRL) && obj.priceBRL > 0) {
    priceBRL = roundPriceBRL(obj.priceBRL);
  }
  const wantCards: WantCardRef[] = [];
  const wantCardIds = new Set<string>();
  if (Array.isArray(obj.wantCards)) {
    for (const item of obj.wantCards) {
      if (wantCards.length >= MAX_WANT) break;
      if (!item || typeof item !== "object") continue;
      const c = item as Record<string, unknown>;
      if (typeof c.id !== "string" || typeof c.name !== "string" || typeof c.setId !== "string") continue;
      if (wantCardIds.has(c.id)) continue;
      wantCardIds.add(c.id);
      wantCards.push({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl === null || typeof c.imageUrl === "string" ? c.imageUrl : null,
        setId: c.setId,
      });
    }
  }
  return { priceBRL, wantCards };
}
