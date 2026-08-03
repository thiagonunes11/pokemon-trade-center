import { useQueries, useQuery } from "@tanstack/react-query";

import {
  fetchCatalogSeries,
  fetchSeriesSets,
  fetchSetWithFallback,
  searchCatalogCards,
} from "@/lib/tcgdex";

export function useCatalogSeries() {
  return useQuery({
    queryKey: ["catalog-series"],
    queryFn: fetchCatalogSeries,
  });
}

export function useSeriesSets(seriesId: string) {
  return useQuery({
    queryKey: ["series-sets-v5", seriesId],
    queryFn: () => fetchSeriesSets(seriesId),
    enabled: Boolean(seriesId),
  });
}

export function useCatalogCardSearch(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ["catalog-card-search-v4", search],
    queryFn: () => searchCatalogCards(search),
    enabled,
  });
}

export function useSetsByIds(setIds: string[]) {
  return useQueries({
    queries: setIds.map((setId) => ({
      queryKey: ["set-metadata-v2", setId],
      queryFn: () =>
        fetchSetWithFallback(setId, {
          includePokemonTcg: false,
          includeCdn: false,
        }),
    })),
  });
}
