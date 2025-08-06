"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  AlertTriangle, 
  Target, 
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAIInsights, useGenerateAIInsights, useDismissAIInsight } from '@/hooks/useFinancialData';
import { useFinancialStore } from '@/stores/financialStore';
import type { AIInsight } from '@/services/aiFinancialAdvisor';

const iconMap = {
  spending_pattern: TrendingUp,
  savings_opportunity: Lightbulb,
  risk_alert: AlertTriangle,
  goal_progress: Target,
  investment_advice: Brain,
};

const colorMap = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const categoryMap = {
  spending_pattern: 'Spending Analysis',
  savings_opportunity: 'Savings Opportunities',
  risk_alert: 'Risk Management',
  goal_progress: 'Goal Tracking',
  investment_advice: 'Investment Strategy',
};

interface DetailedInsightCardProps {
  insight: AIInsight;
  onDismiss: (id: string) => void;
}

function DetailedInsightCard({ insight, onDismiss }: DetailedInsightCardProps) {
  const Icon = iconMap[insight.type];
  
  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900">
              <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <CardTitle className="text-lg mb-1">{insight.title}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className={colorMap[insight.impact]}>
                  {insight.impact} impact
                </Badge>
                <Badge variant="outline">
                  {categoryMap[insight.type]}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {Math.round((insight.confidence || 0) * 100)}% confidence
                </Badge>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDismiss(insight.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Analysis</h4>
          <p className="text-muted-foreground">{insight.description}</p>
        </div>
        
        {(insight.potential_savings != null && insight.potential_savings > 0) ? (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Potential Savings
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ${insight.potential_savings.toLocaleString()}
            </p>
            {insight.timeline ? (
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {insight.timeline}
              </p>
            ) : null}
          </div>
        ) : null}
        
        {insight.actionable_steps?.length ? (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-teal-600" />
              Recommended Actions
            </h4>
            <div className="space-y-2">
              {insight.actionable_steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 text-sm font-medium flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm">{step}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FinancialHealthOverview() {
  const { metrics } = useFinancialStore();
  
  // Calculate health score based on various factors
  const calculateHealthScore = () => {
    let score = 0;
    
    // Ensure we have valid numeric values to avoid NaN
    const monthlyIncome = metrics.monthlyIncome || 0;
    const monthlyExpenses = metrics.monthlyExpenses || 0;
    const monthlyCashFlow = metrics.monthlyCashFlow || 0;
    
    // Cash flow health (40% weight)
    if (monthlyCashFlow > 0 && monthlyIncome > 0) {
      const cashFlowRatio = monthlyCashFlow / monthlyIncome;
      score += Math.min(cashFlowRatio * 40, 40);
    }
    
    // Savings rate (30% weight)
    if (monthlyIncome > 0) {
      const savingsRate = (monthlyIncome - monthlyExpenses) / monthlyIncome;
      score += Math.min(Math.max(savingsRate * 30, 0), 30);
    }
    
    // Net worth growth (30% weight) - simplified
    score += 20; // Placeholder for net worth trend analysis
    
    return Math.min(Math.max(Math.round(score), 0), 100);
  };
  
  const healthScore = calculateHealthScore();
  const healthLevel = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Attention';
  const healthColor = healthScore >= 80 ? 'text-green-600' : healthScore >= 60 ? 'text-blue-600' : healthScore >= 40 ? 'text-orange-600' : 'text-red-600';
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-teal-600" />
          <CardTitle>AI Financial Health Assessment</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mb-4">
              <div className={`text-4xl font-bold ${healthColor}`}>
                {healthScore}
              </div>
              <div className="text-sm text-muted-foreground">Health Score</div>
            </div>
            <Badge variant="outline" className={healthColor}>
              {healthLevel}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Cash Flow</span>
                <span className={metrics.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {metrics.monthlyCashFlow >= 0 ? 'Positive' : 'Negative'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${metrics.monthlyCashFlow >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ 
                    width: `${Math.min(
                      Math.abs(metrics.monthlyCashFlow || 0) / Math.max(metrics.monthlyIncome || 1, 1) * 100, 
                      100
                    )}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Savings Rate</span>
                <span>
                  {(metrics.monthlyIncome || 0) > 0 
                    ? Math.round(((metrics.monthlyIncome - metrics.monthlyExpenses) / metrics.monthlyIncome) * 100)
                    : 0
                  }%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ 
                    width: `${Math.min(
                      Math.max(
                        (metrics.monthlyIncome || 0) > 0 
                          ? ((metrics.monthlyIncome - metrics.monthlyExpenses) / metrics.monthlyIncome) * 100
                          : 0,
                        0
                      ), 
                      100
                    )}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Strong asset base</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span>Goal tracking active</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="hR-4 w-4 text-orange-600" />
              <span>Monitor spending trends</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComprehensiveAIAnalysis() {
  // Use React Query hooks
  const { data: aiInsights = [], isLoading, error } = useAIInsights();
  const generateInsights = useGenerateAIInsights();
  const dismissInsight = useDismissAIInsight();
  
  const handleDismissInsight = async (id: string) => {
    try {
      await dismissInsight.mutateAsync(id);
    } catch (error) {
      console.error('Failed to dismiss insight:', error);
    }
  };

  const handleGenerateInsights = async () => {
    try {
      await generateInsights.mutateAsync();
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  };
  
  // Ensure aiInsights is an array before processing
  const insightsArray = Array.isArray(aiInsights) ? aiInsights : [];
  
  // Group insights by category
  const groupedInsights = insightsArray.reduce((acc: Record<string, AIInsight[]>, insight: AIInsight) => {
    const category = insight.type;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(insight);
    return acc;
  }, {} as Record<string, AIInsight[]>);
  
  // Sort insights by priority and impact
  Object.keys(groupedInsights).forEach(category => {
    groupedInsights[category].sort((a: AIInsight, b: AIInsight) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      if (impactOrder[a.impact] !== impactOrder[b.impact]) {
        return impactOrder[b.impact] - impactOrder[a.impact];
      }
      return (b.priority || 0) - (a.priority || 0);
    });
  });

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-teal-600" />
            Comprehensive AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto mb-4 text-teal-600 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Loading AI Insights</h3>
            <p className="text-muted-foreground">
              Fetching your personalized financial insights...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-teal-600" />
            Comprehensive AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Insights</h3>
            <p className="text-muted-foreground mb-4">
              Failed to load AI insights. Please try generating new insights.
            </p>
            <Button onClick={handleGenerateInsights} disabled={generateInsights.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${generateInsights.isPending ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <FinancialHealthOverview />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-teal-600" />
              Comprehensive AI Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateInsights}
                disabled={generateInsights.isPending}
                className="text-xs"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${generateInsights.isPending ? 'animate-spin' : ''}`} />
                {generateInsights.isPending ? 'Analyzing...' : 'Refresh Analysis'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {insightsArray.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No insights available</h3>
              <p className="text-muted-foreground mb-4">
                Generate AI insights to get personalized financial recommendations.
              </p>
              <Button onClick={handleGenerateInsights} disabled={generateInsights.isPending}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Insights
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="spending_pattern">Spending</TabsTrigger>
                <TabsTrigger value="savings_opportunity">Savings</TabsTrigger>
                <TabsTrigger value="risk_alert">Risks</TabsTrigger>
                <TabsTrigger value="goal_progress">Goals</TabsTrigger>
                <TabsTrigger value="investment_advice">Investments</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4 mt-6">
                {insightsArray
                  .sort((a: AIInsight, b: AIInsight) => {
                    const impactOrder = { high: 3, medium: 2, low: 1 };
                    if (impactOrder[a.impact] !== impactOrder[b.impact]) {
                      return impactOrder[b.impact] - impactOrder[a.impact];
                    }
                    return (b.priority || 0) - (a.priority || 0);
                  })
                  .map((insight: AIInsight) => (
                    <div key={insight.id}>
                    <DetailedInsightCard
                      insight={insight}
                      onDismiss={handleDismissInsight}
                    />
                    </div>
                  ))}
              </TabsContent>
              
              {Object.keys(groupedInsights).map(category => (
                <TabsContent key={category} value={category} className="space-y-4 mt-6">
                  {groupedInsights[category].map((insight: AIInsight) => (
                    <DetailedInsightCard
                      key={insight.id}
                      insight={insight}
                      onDismiss={handleDismissInsight}
                    />
                  ))}
                  {groupedInsights[category].length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">
                        No {categoryMap[category as keyof typeof categoryMap]?.toLowerCase()} insights available.
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
