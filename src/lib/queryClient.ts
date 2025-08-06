import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus by default (can be overridden)
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys factory for better organization
export const queryKeys = {
  all: ['financial-data'] as const,
  accounts: () => [...queryKeys.all, 'accounts'] as const,
  transactions: (params?: { limit?: number; accountId?: string }) => 
    [...queryKeys.all, 'transactions', params] as const,
  goals: () => [...queryKeys.all, 'goals'] as const,
  insights: () => [...queryKeys.all, 'insights'] as const,
  analytics: (params?: { 
    startDate?: string; 
    endDate?: string; 
    preset?: string; 
    compare?: boolean 
  }) => [...queryKeys.all, 'analytics', params] as const,
  metrics: () => [...queryKeys.all, 'metrics'] as const,
  dataVersion: () => [...queryKeys.all, 'data-version'] as const,
  userProfile: () => ['user', 'profile'] as const,
} as const;
