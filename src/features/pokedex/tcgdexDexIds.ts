import { tcgdexEn, tcgdexPt } from "@/lib/tcgdex";

function settledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

/** Lookup leve — só TCGdex, sem fallback Pokémon TCG. */
export async function fetchCardDexIds(
  cardId: string,
): Promise<{ dexIds: number[]; cardName: string | null }> {
  const [ptResult, enResult] = await Promise.allSettled([
    tcgdexPt.card.get(cardId),
    tcgdexEn.card.get(cardId),
  ]);
  const pt = settledValue(ptResult);
  const en = settledValue(enResult);
  const card = pt ?? en;
  if (!card) return { dexIds: [], cardName: null };

  const dexIds = Array.isArray(card.dexId)
    ? card.dexId.filter((n): n is number => Number.isFinite(n))
    : [];
  const cardName =
    (typeof pt?.name === "string" && pt.name) ||
    (typeof en?.name === "string" && en.name) ||
    null;

  return { dexIds, cardName };
}
