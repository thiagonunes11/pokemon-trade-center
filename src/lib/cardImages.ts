export type CardImageQuality = "low" | "high";

/** Verso oficial hospedado em `public/` — fallback visual quando não há arte. */
export const CARD_BACK_IMAGE_URL = "/card-back.png";

function isCompleteImageUrl(value: string): boolean {
  try {
    const pathname = new URL(value, "https://local.invalid").pathname;
    return /\.(?:webp|png|jpe?g|avif)$/i.test(pathname);
  } catch {
    return /\.(?:webp|png|jpe?g|avif)(?:$|\?)/i.test(value);
  }
}

/** Aceita tanto a URL-base da TCGdex quanto URLs completas de outras fontes. */
export function resolveCardImageUrl(
  image: string | null | undefined,
  quality: CardImageQuality,
  highImage?: string | null,
): string | null {
  const selected = quality === "high" && highImage ? highImage : image;
  if (!selected) return null;
  if (isCompleteImageUrl(selected)) return selected;
  return `${selected}/${quality}.webp`;
}

/**
 * URL para exibir na UI: arte real ou verso da carta.
 * Não usar ao persistir coleção/listings — aí prefira `resolveCardImageUrl`.
 */
export function resolveDisplayCardImageUrl(
  image: string | null | undefined,
  quality: CardImageQuality = "low",
  highImage?: string | null,
): string {
  return (
    resolveCardImageUrl(image, quality, highImage) ?? CARD_BACK_IMAGE_URL
  );
}

const imageReachability = new Map<string, Promise<boolean>>();

/**
 * Confirma se a URL devolve imagem de verdade.
 * O CDN pokemontcg.io às vezes responde 404 com o verso da carta como corpo;
 * filtramos por status para não tratar isso como arte oficial da carta.
 */
export function isReachableImageUrl(url: string): Promise<boolean> {
  const cached = imageReachability.get(url);
  if (cached) return cached;

  const request = (async () => {
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), 4_000);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "image/*,*/*", Range: "bytes=0-0" },
        signal: controller.signal,
      });
      controller.abort();
      return response.ok;
    } catch {
      return false;
    } finally {
      globalThis.clearTimeout(timer);
    }
  })();

  imageReachability.set(url, request);
  return request;
}

/** Primeira URL da lista que responde OK (200/206). */
export async function firstReachableImageUrl(
  urls: Array<string | null | undefined>,
): Promise<string | null> {
  for (const url of urls) {
    if (!url) continue;
    if (await isReachableImageUrl(url)) return url;
  }
  return null;
}
