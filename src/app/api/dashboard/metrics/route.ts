import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, corsHeaders } from '@/lib/middleware';
import { 
  accountOperations, 
  transactionOperations,
  goalOperations
} from '@/lib/database';

/**
 * GET /api/dashboard/metrics
 * Get comprehensive financial metrics
 */
async function getFinancialMetrics(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    
    // Fetch all required data in parallel
    const [
      accounts,
      recentTransactions,
      goals,
      balancesByType,
      cashFlow
    ] = await Promise.all([
      accountOperations.getUserAccountsWithTransactions(user.id),
      transactionOperations.getTransactionsPaginated(user.id, 1, 100),
      goalOperations.getUserGoalsWithProgress(user.id),
      accountOperations.getTotalBalancesByType(user.id),
      transactionOperations.getMonthlyCashFlow(user.id, new Date().getFullYear(), new Date().getMonth() + 1)
    ]);

    // Calculate basic financial metrics
    const totalAssets = balancesByType.assets || 0;
    const totalLiabilities = balancesByType.liabilities || 0;
    const netWorth = totalAssets - totalLiabilities;
    
    // Calculate monthly income and expenses from recent transactions
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthTransactions = recentTransactions.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    currentMonthTransactions.forEach(transaction => {
      if (transaction.amount < 0) {
        // Negative amounts are expenses (money going out)
        monthlyExpenses += Math.abs(transaction.amount);
      } else {
        // Positive amounts are income (money coming in)
        monthlyIncome += transaction.amount;
      }
    });

    const monthlyCashFlow = monthlyIncome - monthlyExpenses;
    
    // Calculate emergency fund ratio (assuming savings accounts)
    const savingsBalance = accounts
      .filter(account => account.type === 'savings')
      .reduce((sum, account) => sum + (account.balance || 0), 0);
    const emergencyFundRatio = monthlyExpenses > 0 ? savingsBalance / monthlyExpenses : 0;
    
    // Calculate debt-to-income ratio
    const debtBalance = accounts
      .filter(account => account.type === 'credit' || account.type === 'loan')
      .reduce((sum, account) => sum + Math.abs(account.balance || 0), 0);
    const debtToIncomeRatio = monthlyIncome > 0 ? debtBalance / (monthlyIncome * 12) : 0;

    const metrics = {
      netWorth,
      totalAssets,
      totalLiabilities,
      monthlyIncome,
      monthlyExpenses,
      monthlyCashFlow,
      emergencyFundRatio,
      debtToIncomeRatio,
      // Additional metrics for analytics
      savingsBalance,
      debtBalance,
      accountsCount: accounts.length,
      transactionsCount: recentTransactions.pagination.total,
      goalsCount: goals.length,
      completedGoalsCount: goals.filter(g => g.current >= g.target).length
    };

    return NextResponse.json(metrics, { status: 200 });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial metrics', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/dashboard/metrics
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin || undefined);
  return new NextResponse(null, { status: 200, headers });
}

// Export protected routes
export const GET = withAuth(getFinancialMetrics);
