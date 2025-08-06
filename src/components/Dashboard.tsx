"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { PlaidLinkComponent } from '@/components/PlaidLinkComponent';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { 
  Eye, 
  EyeOff, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  CreditCard, 
  Target, 
  BarChart3, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Bell,
  Settings,
  Plus,
  Activity,
  Calendar,
  Filter,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PriorityAlertsCard } from '@/components/dashboard/PriorityAlertsCard';
import { GoalsCard } from '@/components/dashboard/GoalsCard';
import { useAccounts, useTransactions, useGoals, useRefreshAllData } from '@/hooks/useFinancialData';
import { useFinancialStore } from '@/stores/financialStore';

export function Dashboard() {
  const { user } = useAuth();
  const { 
    balancesVisible, 
    metrics, 
    aiInsights,
    aiInsightsEnabled,
    isAIProcessing,
    toggleBalancesVisible
  } = useFinancialStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [animationKey, setAnimationKey] = useState(0);

  // Use React Query hooks for data
  const { 
    data: accounts = [], 
    isLoading: accountsLoading, 
    error: accountsError 
  } = useAccounts();
  
  const { 
    data: transactions = [], 
    isLoading: transactionsLoading, 
    error: transactionsError 
  } = useTransactions(10); // Only get 10 recent transactions for dashboard
  
  const { 
    data: goals = [], 
    isLoading: goalsLoading 
  } = useGoals();

  // Refresh all data mutation
  const refreshMutation = useRefreshAllData();

  // Loading states
  const isLoading = accountsLoading || transactionsLoading || goalsLoading;
  const isRefreshing = refreshMutation.isPending;

  // Memoize filtered data
  const displayAccounts = useMemo(() => accounts?.length > 0 ? accounts : [], [accounts]);
  const recentTransactions = useMemo(() => transactions?.slice(0, 10) || [], [transactions]);

  // Create refreshData function for compatibility
  const refreshData = useCallback(async () => {
    try {
      await refreshMutation.mutateAsync();
      setAnimationKey((prev: number) => prev + 1);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [refreshMutation]);

  // Memoize expensive calculations
  const displayMetrics = useMemo(() => {
    const totalBalance = accounts.reduce((sum, account) => 
      sum + (account.balances?.current || 0), 0
    );
    
    const totalAvailable = accounts.reduce((sum, account) => 
      sum + (account.balances?.available || 0), 0
    );

    // Calculate recent spending (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSpending = transactions
      .filter(t => new Date(t.date) >= thirtyDaysAgo && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const recentIncome = transactions
      .filter(t => new Date(t.date) >= thirtyDaysAgo && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      netWorth: totalBalance,
      totalAssets: totalBalance,
      monthlyIncome: recentIncome,
      monthlyExpenses: recentSpending,
      monthlyCashFlow: recentIncome - recentSpending,
      emergencyFundRatio: metrics?.emergencyFundRatio || 0,
      debtToIncomeRatio: metrics?.debtToIncomeRatio || 0,
      savingsRate: recentIncome ? ((recentIncome - recentSpending) / recentIncome) * 100 : 0,
      investmentGrowth: 12.4 // TODO: Calculate from investment account changes
    };
  }, [accounts, transactions, metrics]);

  // Memoized handlers
  const handleRefresh = useCallback(async () => {
    try {
      await refreshMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [refreshMutation]);

  const formatCurrency = useCallback((amount: number) => {
    if (!balancesVisible) return '••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, [balancesVisible]);

  const formatCompactCurrency = useCallback((amount: number) => {
    if (!balancesVisible) return '••••';
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  }, [balancesVisible]);

  // Error handling
  if (accountsError || transactionsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Data</h3>
            <p className="text-gray-600 mb-4">
              There was an error loading your financial data. Please try refreshing.
            </p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

   return (
     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
       {/* Animated Background Elements */}
       <div className="fixed inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
       </div>
 
       <div className="relative max-w-7xl mx-auto p-6">
         {/* Header */}
         <div className="mb-8">
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
             <div className="space-y-2">
               <div className="flex items-center gap-3">
                 <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                   Financial Dashboard
                 </h1>
                 <Badge variant="secondary" className="animate-pulse">
                   <Sparkles className="w-3 h-3 mr-1" />
                   AI Powered
                 </Badge>
               </div>
               <p className="text-slate-600 dark:text-slate-400 text-lg">
                 Your complete financial overview with intelligent insights
               </p>
             </div>
             
             <div className="flex items-center gap-3">
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={() => toggleBalancesVisible()}
                 className="group transition-all duration-200 hover:scale-105"
               >
                 {balancesVisible ? (
                   <Eye className="h-4 w-4 mr-2 group-hover:text-blue-600" />
                 ) : (
                   <EyeOff className="h-4 w-4 mr-2 group-hover:text-blue-600" />
                 )}
                 {balancesVisible ? 'Hide' : 'Show'} Balances
               </Button>
               
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={handleRefresh}
                 disabled={isLoading}
                 className="group transition-all duration-200 hover:scale-105"
               >
                 <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                 {isLoading ? 'Syncing...' : 'Refresh'}
               </Button>
               
               <PlaidLinkComponent
                 userId={user?.id || ''} 
                 variant="button"
                 onSuccess={(publicToken, metadata) => {
                   refreshData();
                 }}
               />
             </div>
           </div>
         </div>
 
         {/* Key Metrics Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <MetricCard
             title="Net Worth"
             value={formatCompactCurrency(displayMetrics.netWorth)}
             trend={`+${displayMetrics.investmentGrowth}% this month`}
             trendIcon={TrendingUp}
             gradientFrom="green-500"
             gradientTo="emerald-500"
             icon={Wallet}
             animationKey={animationKey}
           />
           
           <MetricCard
             title="Monthly Income"
             value={formatCompactCurrency(displayMetrics.monthlyIncome)}
             trend="Steady growth"
             trendIcon={ArrowUpRight}
             gradientFrom="blue-500"
             gradientTo="cyan-500"
             icon={DollarSign}
             animationKey={animationKey}
           />
           
           <MetricCard
             title="Cash Flow"
             value={formatCompactCurrency(displayMetrics.monthlyCashFlow)}
             trend={`${displayMetrics.savingsRate.toFixed(1)}% savings rate`}
             trendIcon={TrendingUp}
             gradientFrom="purple-500"
             gradientTo="pink-500"
             icon={Activity}
             animationKey={animationKey}
           />
           
           <MetricCard
             title="Monthly Expenses"
             value={formatCompactCurrency(displayMetrics.monthlyExpenses)}
             trend="Track spending"
             trendIcon={ArrowDownRight}
             gradientFrom="orange-500"
             gradientTo="red-500"
             icon={CreditCard}
             animationKey={animationKey}
           />
         </div>
 
         {/* Main Content Tabs */}
         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
           <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
             <TabsTrigger value="overview" className="flex items-center gap-2">
               <BarChart3 className="h-4 w-4" />
               Overview
             </TabsTrigger>
             <TabsTrigger value="accounts" className="flex items-center gap-2">
               <Wallet className="h-4 w-4" />
               Accounts
             </TabsTrigger>
             <TabsTrigger value="goals" className="flex items-center gap-2">
               <Target className="h-4 w-4" />
               Goals
             </TabsTrigger>
           </TabsList>
 
           <TabsContent value="overview" className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Urgent AI Alerts */}
               <PriorityAlertsCard aiInsights={aiInsights} />
 
               {/* Quick Goal Progress */}
               <GoalsCard goals={goals} formatCurrency={formatCurrency} />
             </div>
 
             {/* Recent Activity - Simplified with Lazy Loading */}
             <React.Suspense fallback={
               <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                 <CardContent className="p-6">
                   <div className="animate-pulse space-y-4">
                     <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                     {[...Array(5)].map((_, i) => (
                       <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                     ))}
                   </div>
                 </CardContent>
               </Card>
             }>
               <TransactionTable 
                 transactions={recentTransactions.map((t: any) => ({
                   transaction_id: t.transaction_id,
                   name: t.name,
                   amount: t.amount,
                   date: t.date,
                   category: Array.isArray(t.category) ? t.category[0] || 'Other' : t.category || 'Other',
                   merchant_name: t.merchant_name || undefined
                 }))}
                 title="Recent Activity"
                 showPagination={false}
                 showFilters={false}
                 maxRows={7}
                 balancesVisible={balancesVisible}
               />
             </React.Suspense>
           </TabsContent>
 
           <TabsContent value="accounts" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {displayAccounts.length > 0 ? displayAccounts.slice(0, 6).map((account: any, index: number) => (
                 <Card key={account.account_id || `account-${index}`} className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
                   <CardContent className="p-6">
                     <div className="flex items-center justify-between mb-4">
                       <div>
                         <h3 className="font-semibold text-lg">{account.name}</h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{account.type}</p>
                       </div>
                       <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                         {account.subtype}
                       </div>
                     </div>
                     <div className="space-y-3">
                       <p className="text-2xl font-bold">{formatCurrency(account.balances.current)}</p>
                       <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                         <div 
                           className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                           style={{ width: `${Math.min(Math.abs(account.balances.current) / 100000 * 100, 100)}%` }}
                         ></div>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-500 dark:text-slate-400">
                           Available: {formatCurrency(account.balances.available || account.balances.current)}
                         </span>
                         <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                           <Eye className="h-3 w-3" />
                         </Button>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               )) : (
                 <div className="col-span-full text-center py-12">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Wallet className="h-8 w-8 text-slate-400" />
                   </div>
                   <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No accounts connected</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                     Connect your bank accounts to see your financial overview
                   </p>
                   <PlaidLinkComponent
                     userId={user?.id || ''} 
                     variant="button"
                     onSuccess={(publicToken, metadata) => {
                       refreshData();
                     }}
                   />
                 </div>
               )}
             </div>
             
             {displayAccounts.length > 6 && (
               <div className="text-center">
                 <Button variant="outline" asChild>
                   <a href="/analytics">
                     View All Accounts <ArrowRight className="h-4 w-4 ml-1" />
                   </a>
                 </Button>
               </div>
             )}
           </TabsContent>
 
           <TabsContent value="goals" className="space-y-6">
             <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
               <CardHeader>
                 <CardTitle className="text-xl font-semibold">Financial Goals</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                 {goals && goals.length > 0 ? (
                   goals.map((goal: any, index: number) => {
                     const progress = ((goal.current || 0) / (goal.target || 1)) * 100;
                     return (
                       <div key={goal.id || `goal-${index}`} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                         <div className="flex justify-between items-start mb-3">
                           <div>
                             <h4 className="font-semibold text-lg">{goal.name}</h4>
                             <p className="text-sm text-slate-500 dark:text-slate-400">
                               {formatCurrency(goal.current || 0)} of {formatCurrency(goal.target || 0)}
                             </p>
                           </div>
                           <Badge variant={progress > 75 ? 'default' : 'secondary'}>
                             {progress.toFixed(1)}% Complete
                           </Badge>
                         </div>
                         <div className="space-y-2">
                           <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3">
                             <div 
                               className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out"
                               style={{ width: `${Math.min(progress, 100)}%` }}
                             ></div>
                           </div>
                           <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                             <span>{formatCurrency((goal.target || 0) - (goal.current || 0))} remaining</span>
                             <span>Target: {formatCurrency(goal.target || 0)}</span>
                           </div>
                         </div>
                       </div>
                     );
                   })
                 ) : (
                   <div className="text-center py-12">
                     <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                       <Target className="h-8 w-8 text-slate-400" />
                     </div>
                     <p className="text-slate-500 dark:text-slate-400 text-sm">No goals set yet</p>
                     <p className="text-slate-400 dark:text-slate-500 text-xs">Set financial goals to track your progress</p>
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </div>
     </div>
   );
}
