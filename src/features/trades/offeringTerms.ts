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
    priceBRL = obj.priceBRL;
  }
  const wantCards: WantCardRef[] = [];
  if (Array.isArray(obj.wantCards)) {
    for (const item of obj.wantCards.slice(0, MAX_WANT)) {
      if (!item || typeof item !== "object") continue;
      const c = item as Record<string, unknown>;
      if (typeof c.id !== "string" || typeof c.name !== "string" || typeof c.setId !== "string") continue;
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
