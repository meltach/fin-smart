import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, corsHeaders } from '@/lib/middleware';
import { transactionOperations, dateRangeUtils } from '@/lib/database';

/**
 * GET /api/transactions/analytics
 * Get comprehensive transaction analytics with date range filtering
 */
async function getTransactionAnalytics(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const preset = searchParams.get('preset'); // 'last7days', 'thisMonth', etc.
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const compareWithPrevious = searchParams.get('compare') === 'true';

    // Determine date range
    let dateRange;
    if (preset && dateRangeUtils.getPresetRanges()[preset]) {
      dateRange = dateRangeUtils.getPresetRanges()[preset];
    } else if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else {
      // Default to current month
      dateRange = dateRangeUtils.getPresetRanges()['thisMonth'];
    }

    // Get transactions with optional comparison
    let result;
    if (compareWithPrevious) {
      // Calculate previous period for comparison
      const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
      const previousRange = {
        startDate: new Date(dateRange.startDate.getTime() - duration),
        endDate: new Date(dateRange.endDate.getTime() - duration)
      };
      
      result = await dateRangeUtils.getTransactionsWithDateComparison(
        user.id,
        dateRange,
        previousRange
      );
    } else {
      const transactions = await transactionOperations.getTransactionsPaginated(
        user.id, 1, 1000, { 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate 
        }
      );
      result = { ...transactions, comparison: null };
    }

    // Calculate analytics
    const analytics = {
      dateRange,
      totalTransactions: result.transactions.length,
      totalSpent: result.transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0),
      totalIncome: result.transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0),
      categoryBreakdown: result.transactions.reduce((acc, t) => {
        const categoryKey = Array.isArray(t.category) ? t.category.join(', ') : t.category;
        if (!acc[categoryKey]) acc[categoryKey] = { amount: 0, count: 0, type: t.type };
        acc[categoryKey].amount += t.amount;
        acc[categoryKey].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number; type: string }>),
      dailySpending: result.transactions
        .filter(t => t.type === 'debit')
        .reduce((acc, t) => {
          const date = t.date.toISOString().split('T')[0];
          if (!acc[date]) acc[date] = 0;
          acc[date] += t.amount;
          return acc;
        }, {} as Record<string, number>),
      topMerchants: Object.entries(
        result.transactions
          .filter(t => t.description && t.type === 'debit')
          .reduce((acc, t) => {
            const merchant = t.description;
            if (!acc[merchant]) acc[merchant] = 0;
            acc[merchant] += t.amount;
            return acc;
          }, {} as Record<string, number>)
      )
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([merchant, amount]) => ({ merchant, amount })),
      comparison: result.comparison
    };

    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    console.error('Error fetching transaction analytics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transaction analytics', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/transactions/analytics
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin || undefined);
  return new NextResponse(null, { status: 200, headers });
}

// Export protected routes
export const GET = withAuth(getTransactionAnalytics);
