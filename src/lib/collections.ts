import type { CatalogSetSummary } from "@/lib/tcgdex";

export type CollectionConfig = CatalogSetSummary;

export type CollectionAvailability = "loading" | "available" | "unavailable";

export function getCollectionAvailability(
  cardCount: number | undefined,
  isLoading: boolean,
): CollectionAvailability {
  if (isLoading) return "loading";
  if ((cardCount ?? 0) > 0) return "available";
  return "unavailable";
}

export function isCollectionOpenable(
  availability: CollectionAvailability,
): boolean {
  return availability === "available";
}
