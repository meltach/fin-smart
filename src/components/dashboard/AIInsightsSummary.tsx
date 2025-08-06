"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, ChevronRight, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFinancialStore } from '@/stores/financialStore';

const iconMap = {
  spending_pattern: TrendingUp,
  savings_opportunity: Lightbulb,
  risk_alert: AlertTriangle,
  goal_progress: TrendingUp,
  investment_advice: Brain,
};

const colorMap = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function AIInsightsSummary() {
  const { aiInsights } = useFinancialStore();
  const router = useRouter();
  
  // Get top 2 most important insights (high impact first, then medium)
  const topInsights = aiInsights
    .sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    })
    .slice(0, 2);

  const totalActiveInsights = aiInsights.length;

  const handleViewAll = () => {
    router.push('/analytics');
  };

  if (topInsights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <CardTitle className="text-lg">AI Insights</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleViewAll}
              className="text-muted-foreground hover:text-foreground"
            >
              View Analytics <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>All caught up! No new insights at the moment.</p>
            <p className="text-sm mt-1">Check back later or view detailed analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <CardTitle className="text-lg">AI Insights</CardTitle>
            {totalActiveInsights > 2 && (
              <Badge variant="secondary" className="ml-2">
                +{totalActiveInsights - 2} more
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleViewAll}
            className="text-muted-foreground hover:text-foreground"
          >
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {topInsights.map((insight) => {
          const Icon = iconMap[insight.type];
          return (
            <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{insight.title}</h4>
                  <Badge variant="secondary" className={`${colorMap[insight.impact]} text-xs`}>
                    {insight.impact}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {insight.description}
                </p>
                {insight.actionable_steps && insight.actionable_steps.length > 0 && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 font-medium">
                    Action recommended
                  </p>
                )}
              </div>
            </div>
          );
        })}
        
        {totalActiveInsights > 0 && (
          <Button 
            variant="outline" 
            className="w-full mt-4" 
            onClick={handleViewAll}
          >
            View Complete AI Analysis <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
