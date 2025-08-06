"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  TrendingDown,
  DollarSign,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/utils';

interface QuickAnalytics {
  totalSpent: number;
  totalIncome: number;
  totalTransactions: number;
  topCategories: Array<{ name: string; value: number; count: number }>;
  netCashFlow: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export function TransactionAnalyticsWidget() {
  const [analytics, setAnalytics] = useState<QuickAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuickAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch('/api/transactions/analytics?preset=thisMonth');
      if (response.ok) {
        const data = await response.json();
        
        // Transform the data for the widget
        const topCategories = Object.entries(data.categoryBreakdown)
          .filter(([_, categoryData]: [string, any]) => categoryData.type === 'debit')
          .map(([name, categoryData]: [string, any]) => ({
            name,
            value: categoryData.amount,
            count: categoryData.count
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        setAnalytics({
          totalSpent: data.totalSpent,
          totalIncome: data.totalIncome,
          totalTransactions: data.totalTransactions,
          topCategories,
          netCashFlow: data.totalIncome - data.totalSpent
        });
      }
    } catch (error) {
      console.error('Error fetching quick analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuickAnalytics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            This Month Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            This Month Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No transaction data available for this month
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            This Month Analytics
          </CardTitle>
          <Link href="/analytics">
            <Button variant="ghost" size="sm" className="text-xs">
              View Details
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            </div>
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(analytics.totalSpent)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            </div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(analytics.totalIncome)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className={`h-4 w-4 mr-1 ${analytics.netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <p className="text-xs text-muted-foreground">Net</p>
            <p className={`text-lg font-bold ${analytics.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(analytics.netCashFlow)}
            </p>
          </div>
        </div>

        {/* Top Categories */}
        {analytics.topCategories.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Top Spending Categories</h4>
            <div className="flex justify-between items-center mb-2">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={analytics.topCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {analytics.topCategories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 ml-4">
                <div className="space-y-1">
                  {analytics.topCategories.slice(0, 3).map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate max-w-[80px]">{category.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(category.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Count */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Transactions</span>
            <span className="font-medium">{analytics.totalTransactions}</span>
          </div>
          {analytics.totalTransactions > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Average per transaction</span>
              <span>{formatCurrency(analytics.totalSpent / analytics.totalTransactions)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
