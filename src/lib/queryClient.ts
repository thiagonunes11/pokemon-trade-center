import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 7 * 24 * 60 * 60 * 1000,
      gcTime: 30 * 24 * 60 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});
