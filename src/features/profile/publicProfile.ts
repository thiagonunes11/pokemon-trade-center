import {
  collection,
  getDocs,
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
import { fetchPublicShowcaseCards } from "@/features/profile/showcaseMirror";
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
  handle: string | null;
};

function firestoreErrorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: unknown }).code);
  }
  return "";
}

export async function fetchPublicUserProfile(
  uid: string,
): Promise<PublicUserProfile> {
  const profile = await getPublicProfile(uid);
  if (!profile) {
    return {
      uid,
      displayName: "Treinador",
      cityId: null,
      cityName: null,
      handle: null,
    };
  }

  let cityName: string | null = null;
  if (profile.cityId) {
    try {
      const communities = await fetchCommunities();
      cityName =
        communities.find((c: Community) => c.id === profile.cityId)?.name ??
        null;
    } catch (err) {
      console.warn("[Profile] communities", err);
    }
  }

  return {
    uid,
    displayName: profile.displayName,
    cityId: profile.cityId,
    cityName,
    handle: profile.handle,
  };
}

export async function fetchPublicShowcase(
  uid: string,
): Promise<PublicShowcaseCard[]> {
  try {
    return await fetchPublicShowcaseCards(uid);
  } catch (err) {
    console.warn("[Profile] showcase", firestoreErrorCode(err), err);
    throw err;
  }
}

/**
 * Lista anúncios/procuras de um dono.
 * Só filtra por ownerId (índice automático) e aplica kind no cliente —
 * evita depender do índice composto ownerId+kind+updatedAt.
 */
export async function fetchListingsByOwner(
  uid: string,
  kind: TradeListKind,
): Promise<PublicListing[]> {
  try {
    const col = collection(getFirestoreDb(), "listings");
    const q = query(col, where("ownerId", "==", uid));
    const snap = await getDocs(q);
    const items: PublicListing[] = [];
    for (const docSnap of snap.docs) {
      const parsed = parseListingDoc(docSnap);
      if (parsed && parsed.kind === kind) items.push(parsed);
    }
    items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return items;
  } catch (err) {
    console.warn("[Profile] listings", firestoreErrorCode(err), err);
    throw err;
  }
}

export function profileLoadErrorMessage(err: unknown): string {
  const code = firestoreErrorCode(err);
  if (code === "permission-denied") {
    return "Sem permissão para ler este perfil. Confirme o deploy das regras Firestore.";
  }
  if (code === "failed-precondition") {
    return "Índice do Firestore ainda não está pronto. Aguarde alguns minutos ou rode: firebase deploy --only firestore";
  }
  return "Não foi possível carregar este perfil. Tente de novo.";
}
