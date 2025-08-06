import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { AIInsight } from '@/services/aiFinancialAdvisor';

interface PriorityAlertsCardProps {
  aiInsights: AIInsight[] | null;
}

export const PriorityAlertsCard = React.memo(({ aiInsights }: PriorityAlertsCardProps) => {
  const highImpactInsights = aiInsights?.filter(insight => insight.impact === 'high') || [];
  
  return (
    <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Priority Alerts
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <a href="/analytics">
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </a>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {highImpactInsights.length > 0 ? (
          highImpactInsights
            .slice(0, 2)
            .map((insight, index) => (
              <div key={insight.id || `urgent-${index}`} className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900 dark:text-orange-100 text-sm">{insight.title}</h4>
                    <p className="text-xs text-orange-800 dark:text-orange-200 mt-1 line-clamp-2">
                      {insight.description}
                    </p>
                    {insight.actionable_steps && insight.actionable_steps.length > 0 && (
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-2 font-medium">
                        Action: {insight.actionable_steps[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400">All good!</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">No urgent financial alerts</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PriorityAlertsCard.displayName = 'PriorityAlertsCard';
