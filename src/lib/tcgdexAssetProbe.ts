import {
  listTcgdexAssetBaseCandidates,
  tcgdexAssetProbeUrl,
} from "@/lib/tcgdexAssetUrl";

const PROBE_TIMEOUT_MS = 4_000;
const DEFAULT_CONCURRENCY = 8;

/** Cache: URL de prova → URL-base válida, ou null se 404/miss confirmado. */
const probeCache = new Map<string, Promise<string | null>>();

/**
 * Confirma se o asset existe no CDN.
 * Usa GET (não HEAD): o CORS do assets.tcgdex.net só permite GET/OPTIONS.
 */
export function probeTcgdexAssetBase(baseUrl: string): Promise<string | null> {
  const probeUrl = tcgdexAssetProbeUrl(baseUrl);
  const cached = probeCache.get(probeUrl);
  if (cached) return cached;

  const request = (async () => {
    const controller = new AbortController();
    const timer = globalThis.setTimeout(
      () => controller.abort(),
      PROBE_TIMEOUT_MS,
    );
    try {
      const response = await fetch(probeUrl, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "image/*,*/*", Range: "bytes=0-0" },
      });
      // Cancela o restante do corpo assim que o status chegar.
      controller.abort();
      return response.ok ? baseUrl : null;
    } catch {
      return null;
    } finally {
      globalThis.clearTimeout(timer);
    }
  })();

  probeCache.set(probeUrl, request);
  return request;
}

export async function resolveTcgdexCdnImageBase(
  seriesId: string,
  setId: string,
  localId: string,
): Promise<string | null> {
  const bases = listTcgdexAssetBaseCandidates(seriesId, setId, localId);
  for (const base of bases) {
    const hit = await probeTcgdexAssetBase(base);
    if (hit) return hit;
  }
  return null;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await mapper(items[index], index);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

export type CdnFillTarget = {
  id: string;
  localId: string;
};

/**
 * Para cada carta sem imagem, tenta achar URL-base no CDN (concorrência limitada).
 * Retorna mapa cardId → URL-base.
 */
export async function fillMissingImagesFromTcgdexCdn(
  seriesId: string,
  setId: string,
  cards: CdnFillTarget[],
  concurrency = DEFAULT_CONCURRENCY,
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  if (!seriesId || cards.length === 0) return found;

  const bases = await mapPool(cards, concurrency, async (card) => {
    const base = await resolveTcgdexCdnImageBase(
      seriesId,
      setId,
      String(card.localId),
    );
    return { id: card.id, base };
  });

  for (const row of bases) {
    if (row.base) found.set(row.id, row.base);
  }
  return found;
}
