"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './DataTable';
import { createTransactionColumns, Transaction } from './transaction-columns';

interface TransactionTableProps {
  transactions: Transaction[];
  title?: string;
  showPagination?: boolean;
  showFilters?: boolean;
  maxRows?: number;
  balancesVisible?: boolean;
}

export function TransactionTable({ 
  transactions, 
  title = "Transactions",
  showPagination = true,
  showFilters = true,
  maxRows = 20,
  balancesVisible = true 
}: TransactionTableProps) {
  const columns = createTransactionColumns(balancesVisible);

  return (
    <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={transactions}
          showPagination={showPagination}
          showFilters={showFilters}
          searchPlaceholder="Search transactions..."
          searchKey="name"
        />
      </CardContent>
    </Card>
  );
}
