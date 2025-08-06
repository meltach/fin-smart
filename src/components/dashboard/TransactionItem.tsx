import React from 'react';

interface TransactionItemProps {
  merchant: string;
  date: string;
  amount: number;
}

export function TransactionItem({ merchant, date, amount }: TransactionItemProps) {
  return (
    <div className="flex justify-between p-2 hover:bg-muted/50 rounded">
      <div>
        <p className="font-medium text-foreground">{merchant}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <p className={amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
        {amount < 0 ? '-' : '+'}${Math.abs(amount)}
      </p>
    </div>
  );
}
