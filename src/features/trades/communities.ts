import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firestore";

export type Community = {
  id: string;
  name: string;
  whatsappUrl: string | null;
};

export async function fetchCommunities(): Promise<Community[]> {
  const snap = await getDocs(collection(getFirestoreDb(), "communities"));
  const list: Community[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    if (typeof data.name !== "string") continue;
    list.push({
      id: d.id,
      name: data.name,
      whatsappUrl:
        typeof data.whatsappUrl === "string" && data.whatsappUrl.length > 0
          ? data.whatsappUrl
          : null,
    });
  }
  return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function syncPublicProfile(
  uid: string,
  data: { displayName: string; cityId?: string | null },
): Promise<void> {
  const ref = doc(getFirestoreDb(), "publicProfiles", uid);
  const payload: Record<string, unknown> = {
    displayName: data.displayName.trim() || "Treinador",
    updatedAt: serverTimestamp(),
  };
  if (data.cityId !== undefined) {
    payload.cityId = data.cityId;
  }
  await setDoc(ref, payload, { merge: true });
}

export async function getMyCityId(uid: string): Promise<string | null> {
  const [pub, priv] = await Promise.all([
    getDoc(doc(getFirestoreDb(), "publicProfiles", uid)),
    getDoc(doc(getFirestoreDb(), "users", uid)),
  ]);
  if (pub.exists() && typeof pub.data().cityId === "string") {
    return pub.data().cityId as string;
  }
  if (priv.exists() && typeof priv.data().cityId === "string") {
    return priv.data().cityId as string;
  }
  return null;
}
