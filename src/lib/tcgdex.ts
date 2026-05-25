import TCGdex from "@tcgdex/sdk";
import "./storagePolyfill"; // Initialize storage polyfill first

// TCGdex SDK configured for Brazilian Portuguese
const tcgdex = new TCGdex("pt");

export default tcgdex;

// Set IDs for supported collections
export const SUPPORTED_SETS = {
  FOGO_FANTASMAGORICO: "me02",
  MEGAEVOLUCAO: "me01",
} as const;

export type SupportedSetId =
  (typeof SUPPORTED_SETS)[keyof typeof SUPPORTED_SETS];
