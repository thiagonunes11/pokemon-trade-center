import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cards data doesn't change often, keep it fresh for 10 minutes
      staleTime: 10 * 60 * 1000,
      // Keep unused data in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests up to 2 times
      retry: 2,
      // Don't refetch on window focus (mobile app)
      refetchOnWindowFocus: false,
    },
  },
});
