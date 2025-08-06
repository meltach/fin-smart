import React from 'react';
import { useFinancialStore } from '@/stores/financialStore';

interface AccountRowProps {
  name: string;
  balance: string;
  change: string;
  extra?: string;
}

export function AccountRow({ name, balance, change, extra }: AccountRowProps) {
  const { balancesVisible } = useFinancialStore();
  const isNegative = balance.startsWith('-');
  
  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-2 h-2 bg-teal-500 dark:bg-teal-400 rounded-full"></div>
        <div>
          <p className="font-medium text-foreground">{name}</p>
          {extra && (
            <p className="text-xs text-muted-foreground">{extra}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {balancesVisible ? balance : '••••'}
        </p>
      </div>
    </div>
  );
}
