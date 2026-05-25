import TCGdex from "@tcgdex/sdk";
import "./storagePolyfill"; // Initialize storage polyfill first

// TCGdex SDK configured for Brazilian Portuguese
const tcgdex = new TCGdex("pt");

export default tcgdex;

// Set IDs for supported collections
export const SUPPORTED_SETS = {
  MEGAEVOLUCAO: "me01",
  FOGO_FANTASMAGORICO: "me02",
  HEROIS_EXCELSOS: "me02.5",
  EQUILIBRIO_PERFEITO: "me03",
  CAOS_ASCENDENTE: "me04",
} as const;

export type SupportedSetId =
  (typeof SUPPORTED_SETS)[keyof typeof SUPPORTED_SETS];
