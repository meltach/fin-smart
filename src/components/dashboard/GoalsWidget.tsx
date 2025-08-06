import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GoalWidget } from './GoalWidget';
import { Target, Plus } from 'lucide-react';
import { useFinancialStore } from '@/stores/financialStore';
import { Button } from '@/components/ui/button';

export function GoalsWidget() {
  const { goals } = useFinancialStore();

  // Transform goals data for GoalWidget component
  const transformedGoals = goals
    .slice(0, 2) // Show only first 2 goals in the widget
    .map(goal => ({
      name: goal.name,
      current: goal.current,
      target: goal.target,
      percentage: goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0,
      deadline: goal.deadline 
        ? new Date(goal.deadline).toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
          })
        : 'No deadline',
    }));

  if (goals.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Savings Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Target className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No goals set yet</p>
          <p className="text-xs text-muted-foreground/70 mb-4">
            Create goals to track your financial progress
          </p>
          <Button 
            size="sm" 
            variant="outline"
            className="text-xs"
            onClick={() => window.location.href = '/goals'}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          Savings Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {transformedGoals.map((goal, i) => (
          <GoalWidget
            key={`${goal.name}-${i}`}
            name={goal.name}
            current={goal.current}
            target={goal.target}
            percentage={goal.percentage}
            deadline={goal.deadline}
          />
        ))}
        {goals.length > 2 && (
          <div className="text-center pt-2">
            <Button 
              size="sm" 
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = '/goals'}
            >
              View All Goals ({goals.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
