import { SUPPORTED_SETS, type SupportedSetId } from "@/lib/tcgdex";

export type CollectionConfig = {
  id: SupportedSetId;
  name: string;
  subtitle: string;
  logoUrl: string;
  /** Mensagem exibida quando o catálogo ainda não pode ser aberto */
  unavailableMessage?: string;
};

export const COLLECTIONS: CollectionConfig[] = [
  {
    id: SUPPORTED_SETS.MEGAEVOLUCAO,
    name: "Megaevolução",
    subtitle: "Set base da expansão",
    logoUrl: "https://assets.tcgdex.net/pt/me/me01/logo.webp",
  },
  {
    id: SUPPORTED_SETS.FOGO_FANTASMAGORICO,
    name: "Fogo Fantasmagórico",
    subtitle: "Megaevolução",
    logoUrl: "https://assets.tcgdex.net/pt/me/me02/logo.webp",
  },
  {
    id: SUPPORTED_SETS.HEROIS_EXCELSOS,
    name: "Heróis Excelsos",
    subtitle: "Megaevolução",
    logoUrl: "https://assets.tcgdex.net/pt/me/me02.5/logo.webp",
  },
  {
    id: SUPPORTED_SETS.EQUILIBRIO_PERFEITO,
    name: "Equilíbrio Perfeito",
    subtitle: "Megaevolução",
    logoUrl: "https://assets.tcgdex.net/pt/me/me03/logo.webp",
  },
  {
    id: SUPPORTED_SETS.CAOS_ASCENDENTE,
    name: "Caos Ascendente",
    subtitle: "Megaevolução",
    logoUrl: "https://assets.tcgdex.net/pt/me/me04/logo.webp",
    unavailableMessage: "Catálogo em breve",
  },
];

export function getCollectionById(
  setId: string | undefined,
): CollectionConfig | undefined {
  return COLLECTIONS.find((c) => c.id === setId);
}

export function isSupportedSetId(setId: string): setId is SupportedSetId {
  return COLLECTIONS.some((c) => c.id === setId);
}

export type CollectionAvailability = "loading" | "available" | "unavailable";

export function getCollectionAvailability(
  cardCount: number | undefined,
  isLoading: boolean,
): CollectionAvailability {
  if (isLoading) return "loading";
  if ((cardCount ?? 0) > 0) return "available";
  return "unavailable";
}

export function isCollectionOpenable(availability: CollectionAvailability): boolean {
  return availability === "available";
}
