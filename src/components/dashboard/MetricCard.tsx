import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  trend: string;
  trendIcon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  icon: LucideIcon;
  animationKey: number;
}

export const MetricCard = React.memo(({ 
  title, 
  value, 
  trend, 
  trendIcon: TrendIcon, 
  gradientFrom, 
  gradientTo, 
  icon: Icon,
  animationKey 
}: MetricCardProps) => {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white" key={`${title}-${animationKey}`}>
              {value}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
              <TrendIcon className="h-3 w-3 mr-1" />
              {trend}
            </p>
          </div>
          <div className={`h-12 w-12 bg-gradient-to-r from-${gradientFrom} to-${gradientTo} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';
