"use client";

import React, { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaidLinkComponent } from '@/components/PlaidLinkComponent';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, PiggyBank, Wallet, Brain, Activity, Database, RefreshCw } from 'lucide-react';
import { formatCurrency, formatPercentage, calculateSavingsRate, getProgressColor } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useFinancialMetrics, 
  useTransactions, 
  useTransactionAnalytics,
  useRefreshAllData 
} from '@/hooks/useFinancialData';
import { useFinancialStore } from '@/stores/financialStore';

// Lazy load heavy components
const ComprehensiveAIAnalysis = lazy(() => 
  import('@/components/analytics/ComprehensiveAIAnalysis').then(module => ({ 
    default: module.ComprehensiveAIAnalysis 
  }))
);

const TransactionAnalytics = lazy(() => 
  import('@/components/analytics/TransactionAnalytics').then(module => ({ 
    default: module.TransactionAnalytics 
  }))
);

const TransactionTable = lazy(() => 
  import('@/components/dashboard/TransactionTable').then(module => ({ 
    default: module.TransactionTable 
  }))
);

// Loading component for better UX
const LoadingCard = () => (
  <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
    <CardContent className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { balancesVisible } = useFinancialStore();
  
  // Use React Query hooks for data fetching
  const { data: metrics, isLoading: metricsLoading } = useFinancialMetrics();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(100);
  const { data: analyticsData, isLoading: analyticsLoading } = useTransactionAnalytics({
    preset: '30d',
    compare: true
  });
  const refreshAllData = useRefreshAllData();

  // Loading state for any critical data
  const isLoading = metricsLoading || transactionsLoading;

  // Calculate derived metrics with fallbacks
  const safeMetrics = metrics || {
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netWorth: 0,
    monthlyCashFlow: 0,
    emergencyFundRatio: 0,
    debtToIncomeRatio: 0,
    totalAssets: 0,
    totalLiabilities: 0
  };
  
  const savingsRate = calculateSavingsRate(safeMetrics.monthlyIncome, safeMetrics.monthlyExpenses);
  
  // Calculate real trends using analytics data comparison
  const calculateRealTrend = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Extract trend data from analytics comparison or fallback to 0
  const getTrendFromAnalytics = (type: 'income' | 'expenses'): number => {
    if (!analyticsData?.comparison) return 0;

    const current = type === 'income' ? analyticsData.totalIncome : analyticsData.totalSpent;
    const previous = type === 'income' ? analyticsData.comparison.previousTotal : analyticsData.comparison.currentTotal;
    return calculateRealTrend(current, previous);
  };

  const incomeTrend = getTrendFromAnalytics('income');
  const expensesTrend = getTrendFromAnalytics('expenses');
  
  // For savings rate and net worth, we'll calculate based on current vs comparison period
  const currentSavingsRate = savingsRate;
  const previousIncome = analyticsData?.comparison?.totalIncome || 0;
  const previousExpenses = analyticsData?.comparison?.totalSpent || 0;
  const previousSavingsRate = calculateSavingsRate(previousIncome, previousExpenses);
  const savingsRateTrend = calculateRealTrend(currentSavingsRate, previousSavingsRate);
  
  // Net worth trend - for now use a placeholder since we don't have historical net worth data
  // TODO: Implement historical net worth tracking in the backend
  const netWorthTrend = 0;

  // Handle edge cases for display
  const hasFinancialData = safeMetrics.monthlyIncome > 0 || safeMetrics.monthlyExpenses > 0 || safeMetrics.netWorth > 0;
  
  return (
    <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400">Deep financial insights powered by AI and comprehensive data analysis</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshAllData.mutate()}
                disabled={refreshAllData.isPending}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshAllData.isPending ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Show Plaid Link if no financial data */}
        {!hasFinancialData && !isLoading && (
          <div className="mb-8">
            <PlaidLinkComponent
              userId={user?.id || ''}
              variant="card"
              onSuccess={(publicToken, metadata) => {
                // console.log('Bank connection successful:', { publicToken, metadata });
                // The component will handle the reload automatically
              }}
              onExit={(error, metadata) => {
                if (error) {
                  console.error('Bank connection failed:', error);
                }
              }}
            />
          </div>
        )}

        {/* Show notice for existing data */}
        {hasFinancialData && !isLoading && (
          <div className="mb-8">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                    🎉 Your financial data is connected and up to date!
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                    Real-time insights are being generated from your connected accounts.
                  </p>
                </div>
                <PlaidLinkComponent
                  userId={user?.id || ''}
                  variant="button"
                  className="ml-4"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Patterns
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-6">
            {/* AI Analysis Section */}
            <Suspense fallback={<LoadingCard />}>
              <ComprehensiveAIAnalysis />
            </Suspense>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            {/* Comprehensive Transaction Table */}
            <Suspense fallback={<LoadingCard />}>
              <TransactionTable 
                transactions={(transactions || []).map(t => ({
                  transaction_id: t.transaction_id,
                  name: t.name,
                  amount: t.amount,
                  date: t.date,
                  category: Array.isArray(t.category) ? t.category[0] || 'Other' : t.category || 'Other',
                  merchant_name: t.merchant_name || undefined
                }))}
                title="All Transactions"
                showPagination={true}
                showFilters={true}
                maxRows={25}
                balancesVisible={balancesVisible}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            {/* Transaction Analytics Section */}
            <Suspense fallback={<LoadingCard />}>
              <TransactionAnalytics />
            </Suspense>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Metrics */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Performance Metrics</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Income</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(safeMetrics.monthlyIncome)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center mt-2">
                  {!analyticsData?.comparison ? (
                    <span className="text-sm text-gray-500">No comparison data</span>
                  ) : incomeTrend >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">
                        {formatPercentage(incomeTrend)} from last period
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      <span className="text-sm text-red-600">
                        {formatPercentage(incomeTrend)} from last period
                      </span>
                    </>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(safeMetrics.monthlyExpenses)}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-red-600" />
                </div>
                <div className="flex items-center mt-2">
                  {!analyticsData?.comparison ? (
                    <span className="text-sm text-gray-500">No comparison data</span>
                  ) : expensesTrend >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-red-600 mr-1" />
                      <span className="text-sm text-red-600">
                        {formatPercentage(Math.abs(expensesTrend))} from last period
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">
                        {formatPercentage(Math.abs(expensesTrend))} from last period
                      </span>
                    </>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Savings Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {savingsRate.toFixed(1)}%
                    </p>
                  </div>
                  <PiggyBank className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex items-center mt-2">
                  {!analyticsData?.comparison ? (
                    <span className="text-sm text-gray-500">No comparison data</span>
                  ) : savingsRateTrend >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">
                        {formatPercentage(savingsRateTrend)} from last period
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      <span className="text-sm text-red-600">
                        {formatPercentage(savingsRateTrend)} from last period
                      </span>
                    </>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Worth</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(safeMetrics.netWorth)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">
                    Historical data coming soon
                  </span>
                </div>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Cash Flow</h3>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse space-y-3 w-full">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</span>
                    <span className="font-semibold text-green-600">{formatCurrency(safeMetrics.monthlyIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Expenses</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(safeMetrics.monthlyExpenses)}</span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium">Net Cash Flow</span>
                    <span className={`font-bold text-lg ${safeMetrics.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {safeMetrics.monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(safeMetrics.monthlyCashFlow)}
                    </span>
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Cash Flow Health</span>
                      <span className={safeMetrics.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {safeMetrics.monthlyCashFlow >= 0 ? 'Positive' : 'Negative'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${safeMetrics.monthlyCashFlow >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ 
                          width: `${Math.min(Math.abs(safeMetrics.monthlyCashFlow) / Math.max(safeMetrics.monthlyIncome, 1) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Health Overview</h3>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse space-y-3 w-full">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Emergency Fund Ratio</span>
                      <span className="font-semibold">
                        {safeMetrics.emergencyFundRatio.toFixed(1)} months
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(
                          safeMetrics.emergencyFundRatio, 
                          { good: 6, fair: 3 },
                          true
                        )}`}
                        style={{ width: `${Math.min(safeMetrics.emergencyFundRatio / 6 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Debt-to-Income Ratio</span>
                      <span className="font-semibold">
                        {(safeMetrics.debtToIncomeRatio * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(
                          safeMetrics.debtToIncomeRatio, 
                          { good: 0.36, fair: 0.50 },
                          false
                        )}`}
                        style={{ width: `${Math.min(safeMetrics.debtToIncomeRatio * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {formatCurrency(safeMetrics.totalAssets)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Assets</div>
                      {safeMetrics.totalLiabilities > 0 && (
                        <div className="text-sm text-red-600 mt-1">
                          -{formatCurrency(safeMetrics.totalLiabilities)} liabilities
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}
