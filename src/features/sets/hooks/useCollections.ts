import { useQueries } from "@tanstack/react-query";

import { COLLECTIONS } from "@/lib/collections";
import tcgdex from "@/lib/tcgdex";

export function useCollections() {
  return useQueries({
    queries: COLLECTIONS.map((collection) => ({
      queryKey: ["set", collection.id],
      queryFn: async () => {
        const set = await tcgdex.set.get(collection.id);
        if (!set) {
          throw new Error(`Set ${collection.id} not found`);
        }
        return set;
      },
      staleTime: 1000 * 60 * 30,
    })),
  });
}
