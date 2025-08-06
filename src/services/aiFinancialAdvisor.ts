// AI service for enhanced financial insights
import { PlaidTransaction, PlaidAccount, Goal } from '@/types/plaid';
import { GeminiFinancialAdvisor } from './geminiFinancialAdvisor';
import { getAIConfig } from '@/config/aiConfig';

export interface AIInsight {
  id: string;
  type: 'spending_pattern' | 'savings_opportunity' | 'risk_alert' | 'goal_progress' | 'investment_advice';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  actionable_steps: string[];
  potential_savings?: number;
  timeline?: string;
  category?: string;
  priority: number; // 1-10
}

export interface FinancialForecast {
  cashFlowPrediction: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
  spendingTrends: {
    category: string;
    predictedIncrease: number;
    reasoning: string;
  }[];
  goalProjections: {
    goalId: string;
    projectedCompletionDate: string;
    adjustmentSuggestions: string[];
  }[];
}

export class AIFinancialAdvisor {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private provider: string;
  private geminiAdvisor?: GeminiFinancialAdvisor;

  constructor(apiKey: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
    this.model = model || 'gpt-4';
    
    const config = getAIConfig();
    this.provider = config.provider;
    
    // Initialize Gemini advisor if using Gemini
    if (this.provider === 'gemini') {
      this.geminiAdvisor = new GeminiFinancialAdvisor(apiKey, baseUrl, model);
    }
  }

  /**
   * Analyze spending patterns and generate personalized insights
   */
  async generateSpendingInsights(
    transactions: PlaidTransaction[],
    accounts: PlaidAccount[],
    userProfile: any
  ): Promise<AIInsight[]> {
    // Use Gemini advisor if provider is gemini
    if (this.provider === 'gemini' && this.geminiAdvisor) {
      return this.geminiAdvisor.generateSpendingInsights(transactions, accounts, userProfile);
    }
    
    // Fallback to OpenAI implementation
    // Prepare data for AI analysis
    const analysisData = this.prepareTransactionData(transactions);
    
    const prompt = `
    Analyze the following financial data and provide personalized insights:
    
    Transactions: ${JSON.stringify(analysisData)}
    Account Balances: ${JSON.stringify(accounts.map(a => ({ type: a.type, balance: a.balances.current })))}
    
    Provide insights in the following areas:
    1. Spending patterns and trends
    2. Savings opportunities
    3. Risk alerts (unusual spending, cash flow issues)
    4. Category-specific recommendations
    
    Return insights as JSON array with structure: ${JSON.stringify({
      type: 'spending_pattern',
      title: 'Example title',
      description: 'Detailed explanation',
      confidence: 0.85,
      impact: 'medium',
      actionable_steps: ['Step 1', 'Step 2'],
      potential_savings: 150
    })}
    `;

    try {
      const response = await this.callAI(prompt);
      return this.parseInsights(response);
    } catch (error) {
      console.error('AI insight generation failed:', error);
      return this.getFallbackInsights(transactions);
    }
  }

  /**
   * Generate financial forecasts and predictions
   */
  async generateFinancialForecast(
    transactions: PlaidTransaction[],
    accounts: PlaidAccount[],
    goals: Goal[]
  ): Promise<FinancialForecast> {
    // Use Gemini advisor if provider is gemini
    if (this.provider === 'gemini' && this.geminiAdvisor) {
      return this.geminiAdvisor.generateFinancialForecast(transactions, accounts, goals);
    }
    
    // Fallback to OpenAI implementation
    const historicalData = this.prepareHistoricalData(transactions, accounts);
    
    const prompt = `
    Based on this financial history, generate predictions for:
    1. Next month's cash flow
    2. Spending trend changes by category
    3. Goal completion timeline projections
    
    Historical Data: ${JSON.stringify(historicalData)}
    Goals: ${JSON.stringify(goals)}
    
    Return as JSON with structure: ${JSON.stringify({
      cashFlowPrediction: { nextMonth: 1500, confidence: 0.8 },
      spendingTrends: [{ category: 'Food', predictedIncrease: 15, reasoning: 'Seasonal pattern' }],
      goalProjections: [{ goalId: 'goal1', projectedCompletionDate: '2025-12-01' }]
    })}
    `;

    try {
      const response = await this.callAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Forecast generation failed:', error);
      return this.getFallbackForecast();
    }
  }

  /**
   * Analyze investment portfolio and provide recommendations
   */
  async analyzeInvestmentPortfolio(
    holdings: any[],
    userProfile: any
  ): Promise<AIInsight[]> {
    // Use Gemini advisor if provider is gemini
    if (this.provider === 'gemini' && this.geminiAdvisor) {
      return this.geminiAdvisor.analyzeInvestmentPortfolio(holdings, userProfile);
    }
    
    // Fallback to OpenAI implementation
    const prompt = `
    Analyze this investment portfolio and provide recommendations:
    
    Holdings: ${JSON.stringify(holdings)}
    Risk Tolerance: ${userProfile.riskTolerance}
    Investment Goals: ${JSON.stringify(userProfile.investmentGoals)}
    
    Provide insights on:
    1. Asset allocation optimization
    2. Diversification improvements
    3. Risk assessment
    4. Rebalancing recommendations
    `;

    try {
      const response = await this.callAI(prompt);
      return this.parseInsights(response);
    } catch (error) {
      console.error('Portfolio analysis failed:', error);
      return [];
    }
  }

  /**
   * Generate personalized budget recommendations
   */
  async generateSmartBudget(
    transactions: PlaidTransaction[],
    income: number,
    goals: Goal[]
  ): Promise<Record<string, number>> {
    // Use Gemini advisor if provider is gemini
    if (this.provider === 'gemini' && this.geminiAdvisor) {
      return this.geminiAdvisor.generateSmartBudget(transactions, income, goals);
    }
    
    // Fallback to OpenAI implementation
    const spendingByCategory = this.categorizeSpending(transactions);
    
    const prompt = `
    Create an optimized budget based on:
    
    Current Spending: ${JSON.stringify(spendingByCategory)}
    Monthly Income: ${income}
    Financial Goals: ${JSON.stringify(goals)}
    
    Recommend budget allocations that:
    1. Align with 50/30/20 rule as baseline
    2. Adjust for user's specific goals
    3. Identify optimization opportunities
    4. Account for seasonal variations
    
    Return as JSON object with category: amount pairs.
    `;

    try {
      const response = await this.callAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Smart budget generation failed:', error);
      return this.getDefaultBudget(income);
    }
  }

  // Private helper methods
  private async callAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a financial advisor AI. Provide practical, actionable financial advice based on transaction data. Always return valid JSON when requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private prepareTransactionData(transactions: PlaidTransaction[]) {
    return transactions.map(t => ({
      amount: t.amount,
      category: t.category?.[0] || 'Other',
      date: t.date,
      merchant: t.merchant_name,
      description: t.name
    }));
  }

  private prepareHistoricalData(transactions: PlaidTransaction[], accounts: PlaidAccount[]) {
    // Group transactions by month and category
    const monthlyData = transactions.reduce((acc, t) => {
      const month = t.date.substring(0, 7); // YYYY-MM
      const category = t.category?.[0] || 'Other';
      if (!acc[month]) acc[month] = {};
      if (!acc[month][category]) acc[month][category] = 0;
      acc[month][category] += t.amount;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return {
      monthlySpending: monthlyData,
      accountBalances: accounts.map(a => ({ 
        type: a.type, 
        balance: a.balances.current 
      }))
    };
  }

  private categorizeSpending(transactions: PlaidTransaction[]) {
    return transactions.reduce((acc, t) => {
      const category = t.category?.[0] || 'Other';
      if (!acc[category]) acc[category] = 0;
      acc[category] += t.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  private parseInsights(response: string): AIInsight[] {
    try {
      return JSON.parse(response);
    } catch {
      return [];
    }
  }

  private getFallbackInsights(transactions: PlaidTransaction[]): AIInsight[] {
    // Basic rule-based insights as fallback
    const insights: AIInsight[] = [];
    
    // Example: High grocery spending
    const grocerySpending = transactions
      .filter(t => t.category?.includes('Groceries'))
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (grocerySpending > 500) {
      insights.push({
        id: 'grocery-high',
        type: 'spending_pattern',
        title: 'Higher than average grocery spending',
        description: `You spent $${grocerySpending.toFixed(2)} on groceries this month.`,
        confidence: 0.8,
        impact: 'medium',
        actionable_steps: ['Consider meal planning', 'Look for store discounts'],
        priority: 5
      });
    }

    return insights;
  }

  private getFallbackForecast(): FinancialForecast {
    return {
      cashFlowPrediction: {
        nextMonth: 0,
        nextQuarter: 0,
        confidence: 0.5
      },
      spendingTrends: [],
      goalProjections: []
    };
  }

  private getDefaultBudget(income: number): Record<string, number> {
    return {
      'Housing': income * 0.3,
      'Food': income * 0.15,
      'Transportation': income * 0.15,
      'Utilities': income * 0.1,
      'Entertainment': income * 0.05,
      'Savings': income * 0.2,
      'Other': income * 0.05
    };
  }
}
