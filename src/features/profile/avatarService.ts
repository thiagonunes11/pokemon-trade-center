import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firestore";
import {
  type AvatarPresetId,
  isAvatarPresetId,
} from "@/features/profile/avatarPresets";

async function ensureDisplayName(uid: string): Promise<string> {
  const snap = await getDoc(doc(getFirestoreDb(), "publicProfiles", uid));
  if (snap.exists() && typeof snap.data().displayName === "string") {
    return snap.data().displayName as string;
  }
  return "Treinador";
}

async function patchPublicAvatar(
  uid: string,
  data: {
    avatarType: "preset" | "custom" | null;
    avatarPresetId: AvatarPresetId | null;
    avatarUrl: string | null;
  },
): Promise<void> {
  const displayName = await ensureDisplayName(uid);
  await setDoc(
    doc(getFirestoreDb(), "publicProfiles", uid),
    {
      displayName,
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Plano Spark: só presets locais (sem Firebase Storage). */
export async function setAvatarPreset(
  uid: string,
  presetId: AvatarPresetId,
): Promise<void> {
  if (!isAvatarPresetId(presetId)) {
    throw new Error("Preset inválido.");
  }
  await patchPublicAvatar(uid, {
    avatarType: "preset",
    avatarPresetId: presetId,
    avatarUrl: null,
  });
}

/** Remove avatar e volta para a inicial. */
export async function clearAvatar(uid: string): Promise<void> {
  await patchPublicAvatar(uid, {
    avatarType: null,
    avatarPresetId: null,
    avatarUrl: null,
  });
}
