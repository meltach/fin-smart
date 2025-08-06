import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, corsHeaders } from '@/lib/middleware';
import { getAIConfig } from '@/config/aiConfig';
import { AIFinancialAdvisor } from '@/services/aiFinancialAdvisor';
import { GeminiFinancialAdvisor } from '@/services/geminiFinancialAdvisor';
import { accountOperations, transactionOperations, goalOperations } from '@/lib/database/utils';
import { PlaidTransaction } from '@/types/plaid';

/**
 * POST /api/ai/insights
 * Generate AI-powered financial insights for the authenticated user
 */
async function generateInsights(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    
    console.log(`🤖 Generating AI insights for user ${user.id}...`);
    
    // Check if AI is enabled
    const aiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';
    
    if (!aiEnabled) {
      console.log('AI analysis disabled, returning fallback insights');
      const fallbackInsights = [
        {
          id: Date.now().toString(),
          type: 'spending_pattern',
          title: 'Review Monthly Spending',
          description: 'Analyze your spending patterns to identify areas for optimization.',
          confidence: 0.7,
          impact: 'medium',
          actionable_steps: ['Review transaction categories', 'Set spending limits', 'Track monthly trends'],
          priority: 5,
        },
        {
          id: (Date.now() + 1).toString(),
          type: 'savings_opportunity',
          title: 'Savings Goal Progress',
          description: 'Track your progress towards financial goals and find optimization opportunities.',
          confidence: 0.8,
          impact: 'medium',
          actionable_steps: ['Review goal timelines', 'Increase automatic savings', 'Optimize budget allocation'],
          priority: 6,
        },
      ];
      
      return NextResponse.json({
        insights: fallbackInsights,
        aiProvider: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

    // Fetch user's financial data
    const [accounts, transactionsResult, goals] = await Promise.all([
      accountOperations.getUserAccountsWithTransactions(user.id),
      transactionOperations.getTransactionsPaginated(user.id, 1, 500), // Get recent transactions
      goalOperations.getUserGoalsWithProgress(user.id)
    ]);

    const transactions = transactionsResult.transactions || [];

    console.log(`📊 Data summary: ${accounts.length} accounts, ${transactions.length} transactions, ${goals.length} goals`);

    if (accounts.length === 0 && transactions.length === 0) {
      return NextResponse.json({
        insights: [{
          id: Date.now().toString(),
          type: 'spending_pattern',
          title: 'Connect Your Accounts',
          description: 'Connect your financial accounts to get personalized AI insights.',
          confidence: 1.0,
          impact: 'high',
          actionable_steps: ['Link your bank accounts', 'Connect credit cards', 'Add investment accounts'],
          priority: 10,
        }],
        aiProvider: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

    try {
      // Initialize AI Financial Advisor (simplified)
      const config = getAIConfig();
      
      if (!config.enabled || !config.apiKey) {
        throw new Error('AI service not configured or disabled');
      }
      
      const aiAdvisor = config.provider === 'gemini' 
        ? new GeminiFinancialAdvisor(config.apiKey, config.baseUrl, config.model)
        : new AIFinancialAdvisor(config.apiKey, config.baseUrl, config.model);

      console.log(`🚀 Analyzing with ${config.provider} (${config.model})...`);
      
      // Transform database format to PlaidAccount/Transaction format for AI compatibility
      const plaidAccounts = accounts.map(acc => ({
        account_id: acc.id,
        type: acc.type as any,
        subtype: acc.type as any, // Use type as subtype fallback
        name: acc.name,
        balances: {
          current: acc.balance || 0,
          available: acc.availableBalance || acc.balance || 0,
          limit: null,
          iso_currency_code: 'USD'
        },
        mask: acc.accountNumber?.slice(-4) || undefined,
        official_name: acc.name,
        persistent_account_id: acc.id
      }));

      const plaidTransactions: PlaidTransaction[] = transactions.map(txn => ({
        transaction_id: txn.id,
        account_id: txn.accountId,
        amount: txn.amount,
        date: txn.date.toISOString().split('T')[0], // Convert Date to string format
        name: txn.description || 'Unknown Transaction',
        description: txn.description || 'Transaction description not available',
        category: txn.category || ['Other'],
        pending: false,
        iso_currency_code: 'USD',
        account_owner: null,
        authorized_date: txn.date.toISOString().split('T')[0],
        datetime: txn.date.toISOString().split('T')[0]
      }));

      const plaidGoals = goals.map(goal => ({
        id: goal.id,
        name: goal.name,
        target: goal.target,
        current: goal.current || 0,
        deadline: goal.deadline,
        category: goal.category || 'savings',
        priority: goal.priority || 'medium'
      }));

      // Generate AI insights
      const insights = await aiAdvisor.generateSpendingInsights(
        plaidTransactions,
        plaidAccounts,
        { riskTolerance: 'medium' }
      );

      console.log(`✅ Generated ${insights.length} AI insights`);

      // Generate financial forecast if we have sufficient data
      let forecast = null;
      if (plaidTransactions.length > 10 && plaidAccounts.length > 0) {
        try {
          forecast = await aiAdvisor.generateFinancialForecast(
            plaidTransactions,
            plaidAccounts,
            plaidGoals
          );
          console.log('📈 Generated financial forecast');
        } catch (forecastError) {
          console.warn('Forecast generation failed:', forecastError);
        }
      }

      return NextResponse.json({
        insights,
        forecast,
        aiProvider: config.provider,
        model: config.model,
        timestamp: new Date().toISOString(),
        dataUsed: {
          accountsCount: plaidAccounts.length,
          transactionsCount: plaidTransactions.length,
          goalsCount: plaidGoals.length
        }
      });

    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      
      // Return enhanced fallback insights based on user data
      const fallbackInsights = [];
      
      if (transactions.length > 0) {
        const totalSpending = transactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);
          
        fallbackInsights.push({
          id: `spending-${Date.now()}`,
          type: 'spending_pattern',
          title: 'Monthly Spending Analysis',
          description: `You've spent $${totalSpending.toFixed(2)} in recent transactions. Consider reviewing your spending patterns.`,
          confidence: 0.8,
          impact: 'medium',
          actionable_steps: ['Review high-value transactions', 'Categorize expenses', 'Set monthly budgets'],
          priority: 7,
        });
      }

      if (accounts.length > 0) {
        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        
        fallbackInsights.push({
          id: `balance-${Date.now()}`,
          type: 'savings_opportunity',
          title: 'Account Balance Review',
          description: `Your total account balance is $${totalBalance.toFixed(2)}. Consider optimizing your savings strategy.`,
          confidence: 0.7,
          impact: 'medium',
          actionable_steps: ['Review account allocation', 'Consider high-yield savings', 'Automate transfers'],
          priority: 6,
        });
      }

      return NextResponse.json({
        insights: fallbackInsights,
        error: 'AI analysis failed, using fallback insights',
        aiProvider: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(generateInsights);
export const POST = withAuth(generateInsights);

// Add CORS headers
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders()
  });
};
