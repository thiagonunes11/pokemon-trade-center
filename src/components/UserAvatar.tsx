import {
  getPresetSrc,
  type AvatarPresetId,
  type AvatarType,
  type PublicAvatar,
} from "@/features/profile/avatarPresets";

function hashUid(uid: string): number {
  let h = 0;
  for (let i = 0; i < uid.length; i++) {
    h = (h << 5) - h + uid.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const AVATAR_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#DC2626",
  "#EA580C",
  "#16A34A",
  "#0891B2",
  "#4F46E5",
];

interface UserAvatarProps {
  userId: string;
  name?: string | null;
  size?: number;
  avatarType?: AvatarType | null;
  avatarPresetId?: AvatarPresetId | null;
  avatarUrl?: string | null;
  avatar?: PublicAvatar | null;
}

export function UserAvatar({
  userId,
  name,
  size = 48,
  avatarType,
  avatarPresetId,
  avatarUrl,
  avatar,
}: UserAvatarProps) {
  const type = avatar?.avatarType ?? avatarType ?? null;
  const presetId = avatar?.avatarPresetId ?? avatarPresetId ?? null;
  const url = avatar?.avatarUrl ?? avatarUrl ?? null;

  const customSrc =
    type === "custom" && url ? url : null;
  const presetSrc =
    type === "preset" && presetId ? getPresetSrc(presetId) : null;
  const imageSrc = customSrc ?? presetSrc;

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover bg-[var(--color-bg-elevated)]"
        style={{ width: size, height: size }}
        decoding="async"
      />
    );
  }

  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const bg = AVATAR_COLORS[hashUid(userId) % AVATAR_COLORS.length];

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: size * 0.4,
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
