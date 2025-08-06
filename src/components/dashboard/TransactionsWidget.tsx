import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TransactionItem } from './TransactionItem';
import { useFinancialStore } from '@/stores/financialStore';

// Type for the database transaction (different from PlaidTransaction)
interface DatabaseTransaction {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  description: string;
  category: string;
  subcategory: string | null;
  type: 'credit' | 'debit';
  status: string;
  merchantName: string | null;
  date: string;
  plaidTransactionId: string;
  plaidCategoryId: string | null;
  plaidAccountId: string | null;
  originalDescription: string | null;
  isRecurring: boolean;
  recurringFrequency: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  account: {
    accountName: string;
    type: string;
  };
}

export function TransactionsWidget() {
  const { transactions, isLoading, errors, refreshData, lastSync } = useFinancialStore();
  const typedTransactions = transactions as unknown as DatabaseTransaction[];

  useEffect(() => {
    // Only refresh if we don't have any transactions data and haven't synced recently
    const hasNoData = typedTransactions.length === 0;
    const hasNotSyncedRecently = !lastSync || (Date.now() - lastSync.getTime()) > 5 * 60 * 1000;
    
    if (hasNoData && !isLoading && hasNotSyncedRecently) {
      console.log('TransactionsWidget: No data and no recent sync, triggering refresh');
      refreshData();
    }
  }, []); // Empty dependency array - only run once on mount

  // Get recent 10 transactions
  const recentTransactions = typedTransactions.slice(0, 10);
  const error = errors.length > 0 ? errors[0] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading transactions...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && recentTransactions.length === 0 && <p>No transactions found.</p>}
        {!isLoading &&
          !error &&
          recentTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              merchant={transaction.merchantName || transaction.description}
              date={new Date(transaction.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
              amount={transaction.type === 'debit' ? -transaction.amount : transaction.amount}
            />
          ))}
      </CardContent>
    </Card>
  );
}
