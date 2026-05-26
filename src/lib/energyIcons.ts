import type { ImageSourcePropType } from "react-native";

export type EnergyIconKey =
  | "fire"
  | "water"
  | "grass"
  | "electric"
  | "psychic"
  | "fighting"
  | "dark"
  | "steel"
  | "fairy"
  | "dragon"
  | "normal";

const ENERGY_IMAGES: Record<EnergyIconKey, ImageSourcePropType> = {
  fire: require("@/assets/images/energy/fire.png"),
  water: require("@/assets/images/energy/water.png"),
  grass: require("@/assets/images/energy/grass.png"),
  electric: require("@/assets/images/energy/electric.png"),
  psychic: require("@/assets/images/energy/psychic.png"),
  fighting: require("@/assets/images/energy/fighting.png"),
  dark: require("@/assets/images/energy/dark.png"),
  steel: require("@/assets/images/energy/steel.png"),
  fairy: require("@/assets/images/energy/fairy.png"),
  dragon: require("@/assets/images/energy/dragon.png"),
  normal: require("@/assets/images/energy/normal.png"),
};

/** Nomes retornados pela TCGdex (pt/en) → PNG em assets/images/energy/ */
const TYPE_NAME_TO_KEY: Record<string, EnergyIconKey> = {
  Fogo: "fire",
  Água: "water",
  Planta: "grass",
  Elétrico: "electric",
  Psíquico: "psychic",
  Lutador: "fighting",
  Sombrio: "dark",
  Metal: "steel",
  Fada: "fairy",
  Dragão: "dragon",
  Incolor: "normal",
  Fire: "fire",
  Water: "water",
  Grass: "grass",
  Lightning: "electric",
  Electric: "electric",
  Psychic: "psychic",
  Fighting: "fighting",
  Darkness: "dark",
  Dark: "dark",
  Steel: "steel",
  Fairy: "fairy",
  Dragon: "dragon",
  Colorless: "normal",
  Normal: "normal",
};

export function resolveEnergyIconKey(typeName: string): EnergyIconKey | null {
  return TYPE_NAME_TO_KEY[typeName.trim()] ?? null;
}

export function getEnergyIconSource(
  typeName: string,
): ImageSourcePropType | null {
  const key = resolveEnergyIconKey(typeName);
  return key ? ENERGY_IMAGES[key] : null;
}

export function hasEnergyIcon(typeName: string): boolean {
  return resolveEnergyIconKey(typeName) !== null;
}
