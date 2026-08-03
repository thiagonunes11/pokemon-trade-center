import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  enrichNationalSpeciesPtNames,
  fetchNationalSpecies,
} from "./pokeApi";

const DEX_KEY = ["national-dex-v1"] as const;
const PT_DONE_KEY = ["national-dex-pt-done-v1"] as const;

export function useNationalDex() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DEX_KEY,
    queryFn: fetchNationalSpecies,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  });

  useEffect(() => {
    const list = query.data;
    if (!list?.length) return;
    if (queryClient.getQueryData<boolean>(PT_DONE_KEY)) return;
    if (list.some((s) => s.name !== s.nameEn)) {
      queryClient.setQueryData(PT_DONE_KEY, true);
      return;
    }

    let cancelled = false;
    void enrichNationalSpeciesPtNames(list).then((enriched) => {
      if (cancelled) return;
      queryClient.setQueryData(DEX_KEY, enriched);
      queryClient.setQueryData(PT_DONE_KEY, true);
    });

    return () => {
      cancelled = true;
    };
  }, [query.data, queryClient]);

  return {
    species: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
