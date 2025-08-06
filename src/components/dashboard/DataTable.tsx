"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { 
  Search, 
  Settings2
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "./DataTablePagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  showPagination?: boolean;
  showFilters?: boolean;
  searchPlaceholder?: string;
  searchKey?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title = "Data",
  showPagination = true,
  showFilters = true,
  searchPlaceholder = "Search...",
  searchKey = "name",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [dateFilter, setDateFilter] = useState<string>("all");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // Get unique values for category filter (assuming we're dealing with transactions)
  const categoryColumn = table.getColumn("category");
  const uniqueCategories = React.useMemo(() => {
    if (!categoryColumn) return [];
    const values = data.map((row: any) => row.category).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [data, categoryColumn]);

  return (
    <div className="w-full">
      {showFilters && (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
                className="pl-10 w-full sm:w-64"
              />
            </div>
            
            {categoryColumn && (
              <Select
                value={(categoryColumn.getFilterValue() as string) ?? "all"}
                onValueChange={(value) =>
                  categoryColumn.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Date filter */}
            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value);
                const dateColumn = table.getColumn("date");
                if (!dateColumn) return;
                
                if (value === "all") {
                  dateColumn.setFilterValue(undefined);
                } else {
                  // Set the filter value to the selected time period
                  dateColumn.setFilterValue(value);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Settings2 className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <div className="px-2 py-1.5 text-sm font-medium">Toggle columns</div>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "name" ? "Description" : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      <div className="rounded-md border bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400">No results found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {showPagination && (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}
