import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, corsHeaders } from '@/lib/middleware';
import { 
  userOperations, 
  accountOperations, 
  transactionOperations, 
  goalOperations,
  insightOperations 
} from '@/lib/database';

/**
 * GET /api/dashboard
 * Get comprehensive dashboard data
 */
async function getDashboardData(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const { searchParams } = new URL(request.url);
    
    // Get date range (default to current month)
    const now = new Date();
    const currentMonth = parseInt(searchParams.get('month') || (now.getMonth() + 1).toString());
    const currentYear = parseInt(searchParams.get('year') || now.getFullYear().toString());

    // Fetch all dashboard data in parallel
    const [
      userProfile,
      accounts,
      recentTransactions,
      goals,
      insights,
      monthlySpending,
      cashFlow,
      balancesByType
    ] = await Promise.all([
      userOperations.getUserWithRelations(user.id),
      accountOperations.getUserAccountsWithTransactions(user.id),
      transactionOperations.getTransactionsPaginated(user.id, 1, 10),
      goalOperations.getUserGoalsWithProgress(user.id),
      insightOperations.getRecentInsights(user.id, 5),
      transactionOperations.getSpendingByCategory(
        user.id,
        new Date(currentYear, currentMonth - 1, 1),
        new Date(currentYear, currentMonth, 0)
      ),
      transactionOperations.getMonthlyCashFlow(user.id, currentYear, currentMonth),
      accountOperations.getTotalBalancesByType(user.id)
    ]);

    // Calculate summary metrics
    const totalBalance = Object.values(balancesByType).reduce((sum, balance) => sum + balance, 0);
    const activeGoals = goals.filter(goal => !goal.isCompleted);
    const completedGoals = goals.filter(goal => goal.isCompleted);

    // Calculate spending trends
    const totalSpending = monthlySpending.reduce((sum, category) => sum + Math.abs(category._sum.amount || 0), 0);
    const topSpendingCategory = monthlySpending[0];

    // Build comprehensive dashboard response
    const dashboardData = {
      user: {
        id: userProfile?.id,
        name: userProfile?.name,
        email: userProfile?.email,
        avatar: userProfile?.avatar,
        lastLoginAt: userProfile?.lastLoginAt
      },
      summary: {
        totalBalance,
        monthlyIncome: cashFlow.income,
        monthlyExpenses: cashFlow.expenses,
        netCashFlow: cashFlow.netCashFlow,
        totalSpending,
        activeGoalsCount: activeGoals.length,
        completedGoalsCount: completedGoals.length
      },
      accounts: {
        items: accounts,
        balancesByType,
        totalAccounts: accounts.length
      },
      transactions: {
        recent: recentTransactions.transactions,
        pagination: recentTransactions.pagination
      },
      goals: {
        active: activeGoals.slice(0, 5), // Top 5 active goals
        completed: completedGoals.slice(0, 3), // Recent 3 completed goals
        totalProgress: activeGoals.length > 0 
          ? activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length 
          : 0
      },
      insights: insights,
      analytics: {
        monthlySpending,
        cashFlow,
        topSpendingCategory: topSpendingCategory ? {
          category: topSpendingCategory.category,
          amount: Math.abs(topSpendingCategory._sum.amount || 0)
        } : null,
        period: {
          month: currentMonth,
          year: currentYear
        }
      }
    };

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve dashboard data', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/dashboard
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin || undefined);
  return new NextResponse(null, { status: 200, headers });
}

// Export protected routes
export const GET = withAuth(getDashboardData);
