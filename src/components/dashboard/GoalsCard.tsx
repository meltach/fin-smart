import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Plus } from 'lucide-react';
import { Goal } from '@/types/plaid';

interface GoalsCardProps {
  goals: Goal[] | null;
  formatCurrency: (amount: number) => string;
}

export const GoalsCard = React.memo(({ goals, formatCurrency }: GoalsCardProps) => {
  return (
    <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Top Goals
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <a href="/goals">
            Manage <ArrowRight className="h-4 w-4 ml-1" />
          </a>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals && goals.length > 0 ? (
          goals.slice(0, 3).map((goal, index) => (
            <div key={goal.id || `goal-${index}`} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{goal.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {(((goal.current || 0) / (goal.target || 1)) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${((goal.current || 0) / (goal.target || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{formatCurrency(goal.current || 0)}</span>
                <span>{formatCurrency(goal.target || 0)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <Target className="h-12 w-12 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No goals set yet</p>
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

GoalsCard.displayName = 'GoalsCard';
