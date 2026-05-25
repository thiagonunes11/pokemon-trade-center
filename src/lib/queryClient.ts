import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cards data is static, keep it fresh for 7 days
      staleTime: 7 * 24 * 60 * 60 * 1000,
      // Keep unused data in persistent cache for 30 days
      gcTime: 30 * 24 * 60 * 60 * 1000,
      // Retry failed requests up to 2 times
      retry: 2,
      // Don't refetch on window focus (mobile app)
      refetchOnWindowFocus: false,
    },
  },
});
