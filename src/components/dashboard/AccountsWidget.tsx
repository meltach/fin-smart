import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AccountRow } from './AccountRow';
import { Wallet } from 'lucide-react';
import { useFinancialStore } from '@/stores/financialStore';

export function AccountsWidget() {
  const { accounts, balancesVisible } = useFinancialStore();

  // Transform Plaid account data to display format
  const accountRows = accounts.map((account) => {
    const balance = account.balances.current;
    const formattedBalance = balancesVisible 
      ? `$${balance.toLocaleString()}` 
      : '••••';
    
    let changeType = 'positive';
    let extra = '';
    
    if (account.type === 'credit') {
      changeType = 'negative';
      if (account.balances.limit) {
        const utilization = Math.abs(balance) / account.balances.limit;
        extra = `${(utilization * 100).toFixed(0)}% used`;
      }
    }
    
    return [account.name, formattedBalance, changeType, extra];
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Wallet className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          Account Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {accountRows.map(([name, balance, type, extra], i) => (
          <AccountRow 
            key={i} 
            name={name} 
            balance={balance} 
            change={type} 
            extra={extra}
          />
        ))}
      </CardContent>
    </Card>
  );
}
