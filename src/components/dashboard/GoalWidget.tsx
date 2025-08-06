import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFinancialStore } from '@/stores/financialStore';

interface GoalWidgetProps {
  name: string;
  current: number;
  target: number;
  percentage: number;
  deadline: string;
}

export function GoalWidget({ name, current, target, percentage, deadline }: GoalWidgetProps) {
  const { balancesVisible } = useFinancialStore();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-2 mb-2" />
        <div className="flex justify-between text-xs">
          <span>{balancesVisible ? `$${current}` : '••••'}</span>
          <span>of ${target}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">By {deadline}</p>
      </CardContent>
    </Card>
  );
}
