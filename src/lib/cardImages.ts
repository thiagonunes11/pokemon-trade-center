export type CardImageQuality = "low" | "high";

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
