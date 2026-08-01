import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firestore";
import {
  fetchCommunities,
  type Community,
} from "@/features/trades/communities";
import { getPublicProfile } from "@/features/trades/threadsService";
import {
  type PublicListing,
  parseListingDoc,
} from "@/features/trades/listingsQuery";
import type { TradeListKind } from "@/store/useTradeStore";

export type PublicShowcaseCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
};

export type PublicUserProfile = {
  uid: string;
  displayName: string;
  cityId: string | null;
  cityName: string | null;
};

export async function fetchPublicUserProfile(
  uid: string,
): Promise<PublicUserProfile | null> {
  const profile = await getPublicProfile(uid);
  if (!profile) {
    return {
      uid,
      displayName: "Treinador",
      cityId: null,
      cityName: null,
    };
  }

  let cityName: string | null = null;
  if (profile.cityId) {
    const communities = await fetchCommunities();
    cityName =
      communities.find((c: Community) => c.id === profile.cityId)?.name ?? null;
  }

  return {
    uid,
    displayName: profile.displayName,
    cityId: profile.cityId,
    cityName,
  };
}

export async function fetchPublicShowcase(
  uid: string,
): Promise<PublicShowcaseCard[]> {
  const col = collection(getFirestoreDb(), "collections", uid, "cards");
  const q = query(col, where("inShowcase", "==", true));
  const snap = await getDocs(q);
  const cards: PublicShowcaseCard[] = [];

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (typeof data.id !== "string" || typeof data.name !== "string") continue;
    cards.push({
      id: data.id,
      name: data.name,
      imageUrl:
        data.imageUrl === null || typeof data.imageUrl === "string"
          ? data.imageUrl
          : null,
      setId: typeof data.setId === "string" ? data.setId : "",
    });
  }

  cards.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return cards;
}

export async function fetchListingsByOwner(
  uid: string,
  kind: TradeListKind,
): Promise<PublicListing[]> {
  const col = collection(getFirestoreDb(), "listings");
  const q = query(
    col,
    where("ownerId", "==", uid),
    where("kind", "==", kind),
    orderBy("updatedAt", "desc"),
  );
  const snap = await getDocs(q);
  const items: PublicListing[] = [];
  for (const docSnap of snap.docs) {
    const parsed = parseListingDoc(docSnap);
    if (parsed) items.push(parsed);
  }
  return items;
}
