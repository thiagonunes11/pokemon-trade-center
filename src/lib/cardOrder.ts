/** Extrai o localId de um cardId `{setId}-{localId}` (setId pode ter ponto). */
export function cardLocalId(cardId: string, setId?: string): string {
  if (setId && cardId.startsWith(`${setId}-`)) {
    return cardId.slice(setId.length + 1);
  }
  const i = cardId.lastIndexOf("-");
  return i >= 0 ? cardId.slice(i + 1) : cardId;
}

export function cardLocalIdNumber(cardId: string, setId?: string): number {
  const n = parseInt(cardLocalId(cardId, setId), 10);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

/** Ordem estável de binder: ID natural do set → número da carta → nome. */
export function compareBySetAndNumber(
  a: { id: string; setId: string; name?: string },
  b: { id: string; setId: string; name?: string },
): number {
  const bySet = a.setId.localeCompare(b.setId, "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
  if (bySet !== 0) return bySet;
  const byNum =
    cardLocalIdNumber(a.id, a.setId) - cardLocalIdNumber(b.id, b.setId);
  if (byNum !== 0) return byNum;
  return (a.name ?? "").localeCompare(b.name ?? "", "pt-BR");
}

/** Dentro de um set: ordena por localId numérico. */
export function compareByLocalId(
  a: { localId?: string | number; id?: string; setId?: string },
  b: { localId?: string | number; id?: string; setId?: string },
): number {
  const parse = (c: typeof a) => {
    if (c.localId != null) {
      const n = parseInt(String(c.localId), 10);
      if (Number.isFinite(n)) return n;
    }
    if (c.id) return cardLocalIdNumber(c.id, c.setId);
    return Number.MAX_SAFE_INTEGER;
  };
  return parse(a) - parse(b);
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}
