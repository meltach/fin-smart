import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/utils';
import { queryKeys } from '@/lib/queryClient';
import { PlaidAccount, PlaidTransaction, Goal, SpendingInsight } from '@/types/plaid';

// Accounts hooks
export const useAccounts = () => {
  return useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: async (): Promise<PlaidAccount[]> => {
      const response = await authenticatedFetch('/api/accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const accountsData = await response.json();
      
      // Transform database accounts to PlaidAccount format
      return accountsData.map((account: any) => ({
        account_id: account.providerAccountId || account.id,
        name: account.accountName,
        type: account.type,
        subtype: account.type,
        mask: account.accountNumber?.slice(-4) || null,
        balances: {
          current: account.balance || 0,
          available: account.availableBalance || account.balance || 0,
          limit: null,
          iso_currency_code: account.currency || 'USD'
        }
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Transactions hooks
export const useTransactions = (limit: number = 50, accountId?: string) => {
  return useQuery({
    queryKey: queryKeys.transactions({ limit, accountId }),
    queryFn: async (): Promise<PlaidTransaction[]> => {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (accountId) {
        params.append('accountId', accountId);
      }
      
      const response = await authenticatedFetch(`/api/transactions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      return data.transactions || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for transactions
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Goals hooks
export const useGoals = () => {
  return useQuery({
    queryKey: queryKeys.goals(),
    queryFn: async (): Promise<Goal[]> => {
      const response = await authenticatedFetch('/api/goals');
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Goals don't change often, 10 minutes
  });
};

// Goal mutations
export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goalData: Omit<Goal, 'id'>): Promise<Goal> => {
      const response = await authenticatedFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
      });
      if (!response.ok) {
        throw new Error('Failed to create goal');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch goals
      queryClient.invalidateQueries({ queryKey: queryKeys.goals() });
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goal> }): Promise<Goal> => {
      const response = await authenticatedFetch(`/api/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update goal');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals() });
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await authenticatedFetch(`/api/goals/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals() });
    },
  });
};

// Analytics hooks
export const useTransactionAnalytics = (params?: {
  startDate?: string;
  endDate?: string;
  preset?: string;
  compare?: boolean;
}) => {
  return useQuery({
    queryKey: queryKeys.analytics(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      if (params?.preset) searchParams.append('preset', params.preset);
      if (params?.compare) searchParams.append('compare', 'true');
      
      const response = await authenticatedFetch(`/api/transactions/analytics?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!params, // Only run if params are provided
  });
};

// Data version check for intelligent updates
export const useDataVersion = (lastSync?: Date) => {
  return useQuery({
    queryKey: queryKeys.dataVersion(),
    queryFn: async (): Promise<{ hasUpdates: boolean; version: string }> => {
      const params = new URLSearchParams();
      if (lastSync) {
        params.append('since', lastSync.getTime().toString());
      }
      
      const response = await authenticatedFetch(`/api/data-version?${params}`);
      if (!response.ok) {
        throw new Error('Failed to check data version');
      }
      return response.json();
    },
    staleTime: 0, // Always check when called
    gcTime: 0, // Don't cache
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
    refetchIntervalInBackground: false, // Only when tab is active
    enabled: !!lastSync, // Only run if we have a last sync time
  });
};

// Bulk data refresh hook
export const useRefreshAllData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Invalidate all financial data queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.all });
      // Wait for the most important queries to refetch
      await Promise.all([
        queryClient.refetchQueries({ queryKey: queryKeys.accounts() }),
        queryClient.refetchQueries({ queryKey: queryKeys.transactions({ limit: 50 }) }),
        queryClient.refetchQueries({ queryKey: queryKeys.goals() }),
      ]);
    },
  });
};

// AI Insights hooks
export const useAIInsights = () => {
  return useQuery({
    queryKey: queryKeys.insights(),
    queryFn: async () => {
      const response = await authenticatedFetch('/api/ai/insights');
      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - AI insights don't change as frequently
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1, // Less aggressive retry for AI features
  });
};

export const useGenerateAIInsights = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch('/api/ai/insights', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to generate AI insights');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.insights() });
    },
  });
};

export const useDismissAIInsight = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (insightId: string) => {
      const response = await authenticatedFetch(`/api/ai/insights/${insightId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to dismiss insight');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.insights() });
    },
  });
};

// Financial metrics hooks
export const useFinancialMetrics = () => {
  return useQuery({
    queryKey: queryKeys.metrics(),
    queryFn: async () => {
      const response = await authenticatedFetch('/api/dashboard/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch financial metrics');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};


