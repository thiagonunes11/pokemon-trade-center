import bulbasaur from "@/assets/avatars/bulbasaur.png";
import charmander from "@/assets/avatars/charmander.png";
import squirtle from "@/assets/avatars/squirtle.png";
import pikachu from "@/assets/avatars/pikachu.png";
import eevee from "@/assets/avatars/eevee.png";

export const AVATAR_PRESET_IDS = [
  "bulbasaur",
  "charmander",
  "squirtle",
  "pikachu",
  "eevee",
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESET_IDS)[number];

export type AvatarType = "preset" | "custom";

export type PublicAvatar = {
  avatarType: AvatarType | null;
  avatarPresetId: AvatarPresetId | null;
  avatarUrl: string | null;
};

export const AVATAR_PRESETS: Array<{
  id: AvatarPresetId;
  label: string;
  src: string;
}> = [
  { id: "bulbasaur", label: "Bulbasaur", src: bulbasaur },
  { id: "charmander", label: "Charmander", src: charmander },
  { id: "squirtle", label: "Squirtle", src: squirtle },
  { id: "pikachu", label: "Pikachu", src: pikachu },
  { id: "eevee", label: "Eevee", src: eevee },
];

export function isAvatarPresetId(value: unknown): value is AvatarPresetId {
  return (
    typeof value === "string" &&
    (AVATAR_PRESET_IDS as readonly string[]).includes(value)
  );
}

export function getPresetSrc(id: AvatarPresetId): string {
  return AVATAR_PRESETS.find((p) => p.id === id)?.src ?? bulbasaur;
}

export function parsePublicAvatar(data: {
  avatarType?: unknown;
  avatarPresetId?: unknown;
  avatarUrl?: unknown;
}): PublicAvatar {
  const avatarType =
    data.avatarType === "preset" || data.avatarType === "custom"
      ? data.avatarType
      : null;
  const avatarPresetId = isAvatarPresetId(data.avatarPresetId)
    ? data.avatarPresetId
    : null;
  const avatarUrl =
    typeof data.avatarUrl === "string" && data.avatarUrl.startsWith("https://")
      ? data.avatarUrl
      : null;

  return { avatarType, avatarPresetId, avatarUrl };
}
