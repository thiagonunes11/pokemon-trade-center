import darkPng from "@/assets/images/energy/dark.png";
import dragonPng from "@/assets/images/energy/dragon.png";
import electricPng from "@/assets/images/energy/electric.png";
import fairyPng from "@/assets/images/energy/fairy.png";
import fightingPng from "@/assets/images/energy/fighting.png";
import firePng from "@/assets/images/energy/fire.png";
import grassPng from "@/assets/images/energy/grass.png";
import normalPng from "@/assets/images/energy/normal.png";
import psychicPng from "@/assets/images/energy/psychic.png";
import steelPng from "@/assets/images/energy/steel.png";
import waterPng from "@/assets/images/energy/water.png";

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

const ENERGY_IMAGES: Record<EnergyIconKey, string> = {
  fire: firePng,
  water: waterPng,
  grass: grassPng,
  electric: electricPng,
  psychic: psychicPng,
  fighting: fightingPng,
  dark: darkPng,
  steel: steelPng,
  fairy: fairyPng,
  dragon: dragonPng,
  normal: normalPng,
};

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

export function getEnergyIconSource(typeName: string): string | null {
  const key = resolveEnergyIconKey(typeName);
  return key ? ENERGY_IMAGES[key] : null;
}

export function hasEnergyIcon(typeName: string): boolean {
  return resolveEnergyIconKey(typeName) !== null;
}
