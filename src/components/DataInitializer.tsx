"use client";

import { useEffect } from 'react';
import { useAccounts, useTransactions, useGoals, useDataVersion } from '@/hooks/useFinancialData';
import { useFinancialStore } from '@/stores/financialStore';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

export function DataInitializer() {
  const queryClient = useQueryClient();
  const { 
    setAccounts, 
    setTransactions, 
    setInsights,
    setLoading,
    lastSync,
    setLastSync,
    stopPolling // Stop the old polling mechanism
  } = useFinancialStore();

  // Fetch data using React Query hooks
  const { 
    data: accounts, 
    isLoading: accountsLoading, 
    error: accountsError 
  } = useAccounts();
  
  const { 
    data: transactions, 
    isLoading: transactionsLoading, 
    error: transactionsError 
  } = useTransactions(50);
  
  const { 
    data: goals, 
    isLoading: goalsLoading 
  } = useGoals();

  // Intelligent background sync based on data version
  const { 
    data: versionData,
    error: versionError 
  } = useDataVersion(lastSync || undefined);

  // Set loading state based on critical data
  const isLoading = accountsLoading || transactionsLoading;

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Update store when data is fetched
  useEffect(() => {
    if (accounts) {
      console.log('✅ Accounts loaded via React Query');
      setAccounts(accounts);
    }
  }, [accounts, setAccounts]);

  useEffect(() => {
    if (transactions) {
      console.log('✅ Transactions loaded via React Query');
      setTransactions(transactions);
    }
  }, [transactions, setTransactions]);

  // Update store when goals are fetched
  useEffect(() => {
    if (goals) {
      console.log('✅ Goals loaded via React Query');
      // Goals are handled via React Query hooks - store will be updated automatically
    }
  }, [goals]);

  // Handle data version changes for intelligent updates
  useEffect(() => {
    if (versionData?.hasUpdates) {
      console.log('🔄 New data detected, invalidating queries...');
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals() });
      
      // Update last sync time
      setLastSync(new Date());
    }
  }, [versionData, queryClient, setLastSync]);

  // Handle errors with fallback to mock data
  useEffect(() => {
    if (accountsError || transactionsError) {
      console.warn('Falling back to mock data due to API errors');
      // Import and use mock data as fallback
      import('@/lib/mockData').then(({ mockAccounts, mockTransactions, mockInsights }) => {
        if (accountsError && !accounts) {
          console.log('📦 Loading mock accounts');
          setAccounts(mockAccounts);
        }
        if (transactionsError && !transactions) {
          console.log('📦 Loading mock transactions');
          setTransactions(mockTransactions);
        }
        // Set mock insights as fallback
        setInsights(mockInsights);
      });
    }
  }, [accountsError, transactionsError, accounts, transactions, setAccounts, setTransactions, setInsights]);

  // Stop the old polling mechanism since React Query handles this now
  useEffect(() => {
    stopPolling();
  }, [stopPolling]);

  // Set initial last sync time if not set
  useEffect(() => {
    if (!lastSync && (accounts || transactions)) {
      setLastSync(new Date());
    }
  }, [accounts, transactions, lastSync, setLastSync]);

  // Initialize insights when accounts and transactions are loaded
  useEffect(() => {
    if (accounts && transactions && !accountsError && !transactionsError) {
      // Load real insights or set mock insights
      import('@/lib/mockData').then(({ mockInsights }) => {
        setInsights(mockInsights);
        console.log('✅ Insights initialized');
      });
    }
  }, [accounts, transactions, accountsError, transactionsError, setInsights]);

  return null; // This component doesn't render anything
}
