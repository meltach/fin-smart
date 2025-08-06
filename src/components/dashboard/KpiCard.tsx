import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SparklineData {
  value: number;
}

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  sparkline?: SparklineData[];
  isVisible?: boolean;
}

export function KpiCard({ title, value, change, sparkline, isVisible = true }: KpiCardProps) {
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {isVisible ? value : '••••'}
          </p>
        </div>
      </div>
      <div className="flex items-center mt-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {change}
        </span>
      </div>
      {sparkline && sparkline.length > 0 && (
        <div className="h-12 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line 
                dataKey="value" 
                dot={false} 
                strokeWidth={2} 
                stroke="rgb(34 197 94)"
              />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
