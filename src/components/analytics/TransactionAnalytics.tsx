"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  FileText,
  Target,
  RefreshCw,
  Brain,
  Lightbulb
} from 'lucide-react';
import { useTransactionAnalytics } from '@/hooks/useFinancialData';
import { useAuth } from '@/contexts/AuthContext';

const PRESET_RANGES = {
  'thisMonth': { label: 'This Month' },
  'lastMonth': { label: 'Last Month' },
  'last3months': { label: 'Last 3 Months' }
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

export function TransactionAnalytics() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState<string>('thisMonth');

  // Simplified analytics parameters
  const analyticsParams = useMemo(() => ({
    preset: selectedPreset,
    compare: false, // Simplified - no comparisons
  }), [selectedPreset]);

  // Use React Query for analytics data
  const { 
    data: analytics, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useTransactionAnalytics(analyticsParams);

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Simplified chart data processing
  const chartData = useMemo(() => {
    if (!analytics) return { categoryData: [], topMerchants: [] };

    const categoryData = Object.entries(analytics.categoryBreakdown || {})
      .map(([category, data]: [string, any]) => ({
        category,
        amount: Math.abs(data.amount),
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Top 6 categories only

    const topMerchants = analytics.topMerchants?.slice(0, 5) || []; // Top 5 merchants

    return { categoryData, topMerchants };
  }, [analytics]);

  // Generate simple AI insights
  const generateInsights = useMemo(() => {
    if (!analytics || !chartData.categoryData.length) return [];

    const insights = [];
    const topCategory = chartData.categoryData[0];
    const totalSpent = analytics.totalSpent;
    
    // Spending pattern insight
    if (topCategory && topCategory.amount > totalSpent * 0.3) {
      insights.push({
        type: 'warning',
        icon: Lightbulb,
        title: 'High Category Spending',
        message: `${topCategory.category} accounts for ${Math.round((topCategory.amount / totalSpent) * 100)}% of your spending. Consider reviewing this category.`
      });
    }

    // Cash flow insight
    const netFlow = analytics.totalIncome - analytics.totalSpent;
    if (netFlow > 0) {
      insights.push({
        type: 'positive',
        icon: TrendingUp,
        title: 'Positive Cash Flow',
        message: `You saved ${formatCurrency(netFlow)} this period. Consider setting up automatic savings.`
      });
    } else {
      insights.push({
        type: 'warning',
        icon: Target,
        title: 'Budget Review Needed',
        message: `You spent ${formatCurrency(Math.abs(netFlow))} more than you earned. Review your budget.`
      });
    }

    return insights;
  }, [analytics, chartData]);

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
  };

  return (
    <div className="space-y-6">
      {/* Simplified Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Smart Analytics
              {isFetching && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
            
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESET_RANGES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics content */}
      {analytics && !isLoading && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-600">Total Spent</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(analytics.totalSpent)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Total Income</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(analytics.totalIncome)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Transactions</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {analytics.totalTransactions.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Net Cash Flow</span>
                </div>
                <div className={`text-2xl font-bold mt-2 ${
                  (analytics.totalIncome - analytics.totalSpent) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(analytics.totalIncome - analytics.totalSpent)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          {generateInsights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Smart Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generateInsights.map((insight, index) => {
                    const IconComponent = insight.icon;
                    return (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border ${
                          insight.type === 'positive' 
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                            : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <IconComponent className={`w-5 h-5 mt-0.5 ${
                            insight.type === 'positive' ? 'text-green-600' : 'text-orange-600'
                          }`} />
                          <div>
                            <h4 className="font-medium text-sm">{insight.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {insight.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Simplified Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Category breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                      label={(entry) => entry.category}
                    >
                      {chartData.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Merchants */}
            <Card>
              <CardHeader>
                <CardTitle>Top Merchants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chartData.topMerchants.length > 0 ? (
                    chartData.topMerchants.map((merchant: any, index: number) => {
                      const percentOfTotal = (merchant.amount / analytics.totalSpent) * 100;
                      
                      return (
                        <div key={merchant.merchant} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <span className="font-medium text-sm">{merchant.merchant}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">{formatCurrency(merchant.amount)}</div>
                            <div className="text-xs text-gray-500">{percentOfTotal.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 py-8 text-sm">
                      No merchant data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

