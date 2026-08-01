import TCGdex from "@tcgdex/sdk";

const tcgdex = new TCGdex("pt");

export default tcgdex;

export const SUPPORTED_SETS = {
  MEGAEVOLUCAO: "me01",
  FOGO_FANTASMAGORICO: "me02",
  HEROIS_EXCELSOS: "me02.5",
  EQUILIBRIO_PERFEITO: "me03",
  CAOS_ASCENDENTE: "me04",
} as const;

export type SupportedSetId =
  (typeof SUPPORTED_SETS)[keyof typeof SUPPORTED_SETS];
