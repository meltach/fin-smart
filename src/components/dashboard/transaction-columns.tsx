"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Transaction {
  transaction_id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  account_name?: string;
  merchant_name?: string;
}

interface FormatCurrencyOptions {
  balancesVisible: boolean;
}

const formatCurrency = (amount: number, options: FormatCurrencyOptions) => {
  if (!options.balancesVisible) return '••••';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(Math.abs(amount));
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const createTransactionColumns = (balancesVisible: boolean = true): ColumnDef<Transaction>[] => [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="text-slate-600 dark:text-slate-400">
          {formatDate(row.getValue("date"))}
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.getValue("date"));
      const dateB = new Date(rowB.getValue("date"));
      return dateA.getTime() - dateB.getTime();
    },
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue === "all") return true;
      
      const transactionDate = new Date(row.getValue(columnId));
      const now = new Date();
      let startDate: Date;
      
      switch (filterValue) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          return true;
      }
      
      return transactionDate >= startDate;
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Description
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <div>
          <p className="font-medium text-sm">{transaction.name}</p>
          {transaction.merchant_name && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {transaction.merchant_name}
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      return (
        <Badge variant="outline" className="text-xs">
          {category || 'Other'}
        </Badge>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return (
        <div className="text-right">
          <span className={`font-semibold ${
            amount < 0 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-green-600 dark:text-green-400'
          }`}>
            {amount < 0 ? '-' : '+'}{formatCurrency(amount, { balancesVisible })}
          </span>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const amountA = Math.abs(rowA.getValue("amount"));
      const amountB = Math.abs(rowB.getValue("amount"));
      return amountA - amountB;
    },
  },

];
