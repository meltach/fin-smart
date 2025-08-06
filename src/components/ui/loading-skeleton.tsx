import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>

      {/* Metrics cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </CardContent>
    </Card>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}
