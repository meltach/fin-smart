// Gemini API service for enhanced financial insights
import { GoogleGenAI } from "@google/genai";
import { PlaidTransaction, PlaidAccount, Goal } from '@/types/plaid';

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

export class GeminiFinancialAdvisor {
  private genAI: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, baseUrl?: string, model?: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.model = model || 'gemini-1.5-flash';
  }

  /**
   * Analyze spending patterns and generate personalized insights
   */
  async generateSpendingInsights(
    transactions: PlaidTransaction[],
    accounts: PlaidAccount[],
    userProfile: any
  ): Promise<AIInsight[]> {
    // Prepare data for AI analysis
    const analysisData = this.prepareTransactionData(transactions);
    
    const prompt = `
    As a financial advisor AI, analyze the following financial data and provide personalized insights:
    
    Transactions: ${JSON.stringify(analysisData)}
    Account Balances: ${JSON.stringify(accounts.map(a => ({ type: a.type, balance: a.balances.current })))}
    
    Provide insights in the following areas:
    1. Spending patterns and trends
    2. Savings opportunities
    3. Risk alerts (unusual spending, cash flow issues)
    4. Category-specific recommendations
    
    Return insights as a JSON array with this exact structure:
    [
      {
        "id": "unique-id",
        "type": "spending_pattern" | "savings_opportunity" | "risk_alert" | "goal_progress" | "investment_advice",
        "title": "Brief title",
        "description": "Detailed explanation",
        "confidence": 0.85,
        "impact": "low" | "medium" | "high",
        "actionable_steps": ["Step 1", "Step 2"],
        "potential_savings": 150,
        "priority": 5
      }
    ]
    
    Only return valid JSON, no other text.
    `;

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseInsights(response);
    } catch (error) {
      console.error('Gemini insight generation failed:', error);
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
    const historicalData = this.prepareHistoricalData(transactions, accounts);
    
    const prompt = `
    As a financial advisor AI, analyze this financial history and generate predictions:
    
    Historical Data: ${JSON.stringify(historicalData)}
    Goals: ${JSON.stringify(goals)}
    
    Generate predictions for:
    1. Next month's cash flow
    2. Spending trend changes by category
    3. Goal completion timeline projections
    
    Return as JSON with this exact structure:
    {
      "cashFlowPrediction": {
        "nextMonth": 1500,
        "nextQuarter": 4500,
        "confidence": 0.8
      },
      "spendingTrends": [
        {
          "category": "Food",
          "predictedIncrease": 15,
          "reasoning": "Seasonal pattern analysis"
        }
      ],
      "goalProjections": [
        {
          "goalId": "goal1",
          "projectedCompletionDate": "2025-12-01",
          "adjustmentSuggestions": ["Increase monthly savings by $100"]
        }
      ]
    }
    
    Only return valid JSON, no other text.
    `;

    try {
      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Gemini forecast generation failed:', error);
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
    const prompt = `
    As a financial advisor AI, analyze this investment portfolio and provide recommendations:
    
    Holdings: ${JSON.stringify(holdings)}
    Risk Tolerance: ${userProfile.riskTolerance}
    Investment Goals: ${JSON.stringify(userProfile.investmentGoals)}
    
    Provide insights on:
    1. Asset allocation optimization
    2. Diversification improvements
    3. Risk assessment
    4. Rebalancing recommendations
    
    Return as a JSON array of insights with the same structure as before.
    Only return valid JSON, no other text.
    `;

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseInsights(response);
    } catch (error) {
      console.error('Gemini portfolio analysis failed:', error);
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
    const spendingByCategory = this.categorizeSpending(transactions);
    
    const prompt = `
    As a financial advisor AI, create an optimized budget based on:
    
    Current Spending: ${JSON.stringify(spendingByCategory)}
    Monthly Income: ${income}
    Financial Goals: ${JSON.stringify(goals)}
    
    Create budget allocations that:
    1. Align with 50/30/20 rule as baseline
    2. Adjust for user's specific goals
    3. Identify optimization opportunities
    4. Account for seasonal variations
    
    Return as JSON object with category: amount pairs.
    Example: {"Housing": 1500, "Food": 600, "Transportation": 400}
    
    Only return valid JSON, no other text.
    `;

    try {
      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Gemini smart budget generation failed:', error);
      return this.getDefaultBudget(income);
    }
  }

  // Private helper methods
  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      const result = await this.genAI.models.generateContent({
        model: this.model,
        contents: [{ 
          parts: [{ text: prompt }] 
        }],
        config: {
          temperature: 0.3,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        }
      });

      // Check if we have candidates and extract text
      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No candidates in Gemini API response');
      }

      const candidate = result.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('No content in Gemini API response');
      }

      const text = candidate.content.parts[0].text;
      if (!text) {
        throw new Error('No text in Gemini API response');
      }

      return text;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private prepareTransactionData(transactions: PlaidTransaction[], includeComparison = false) {
    const baseData = transactions.slice(0, 100).map(t => ({
      amount: t.amount,
      category: t.category?.[0] || 'Other',
      date: t.date,
      merchant: t.merchant_name,
      description: t.name
    }));

    if (includeComparison) {
      // Add spending trends analysis
      const monthlySpending = this.categorizeSpendingByMonth(transactions);
      const categoryTrends = this.calculateCategoryTrends(transactions);
      
      return {
        transactions: baseData,
        monthlyTrends: monthlySpending,
        categoryTrends: categoryTrends,
        totalSpending: transactions.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0),
        transactionCount: transactions.length
      };
    }

    return baseData;
  }

  private categorizeSpendingByMonth(transactions: PlaidTransaction[]) {
    return transactions.reduce((acc, t) => {
      const month = t.date.substring(0, 7); // YYYY-MM
      const category = t.category?.[0] || 'Other';
      if (!acc[month]) acc[month] = {};
      if (!acc[month][category]) acc[month][category] = 0;
      acc[month][category] += Math.abs(t.amount);
      return acc;
    }, {} as Record<string, Record<string, number>>);
  }

  private calculateCategoryTrends(transactions: PlaidTransaction[]) {
    const last30Days = transactions.filter(t => 
      new Date(t.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const previous30Days = transactions.filter(t => {
      const date = new Date(t.date);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const currentSpending = this.categorizeSpending(last30Days);
    const previousSpending = this.categorizeSpending(previous30Days);

    const trends: Record<string, { current: number; previous: number; change: number }> = {};
    
    Object.keys({ ...currentSpending, ...previousSpending }).forEach(category => {
      const current = currentSpending[category] || 0;
      const previous = previousSpending[category] || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      
      trends[category] = { current, previous, change };
    });

    return trends;
  }

  /**
   * Enhanced spending insights with date range analysis
   */
  async generateEnhancedSpendingInsights(
    transactions: PlaidTransaction[],
    accounts: PlaidAccount[],
    userProfile: any,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<AIInsight[]> {
    // Filter transactions by date range if provided
    let filteredTransactions = transactions;
    if (dateRange) {
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
      });
    }

    // Prepare enhanced analysis data
    const analysisData = this.prepareTransactionData(filteredTransactions, true);
    
    const prompt = `
    As an expert financial advisor AI, analyze this comprehensive financial data and provide actionable insights:
    
    Analysis Period: ${dateRange ? `${dateRange.startDate.toDateString()} to ${dateRange.endDate.toDateString()}` : 'Recent transactions'}
    
    Transaction Data: ${JSON.stringify(analysisData)}
    Account Balances: ${JSON.stringify(accounts.map(a => ({ type: a.type, balance: a.balances.current })))}
    
    Provide 5-8 personalized insights focusing on:
    1. Spending pattern analysis with trend comparisons
    2. Specific savings opportunities with dollar amounts
    3. Risk alerts for unusual spending or concerning trends
    4. Category-specific actionable recommendations
    5. Cash flow optimization suggestions
    6. Goal alignment recommendations (if spending supports or hinders financial goals)
    
    For each insight, calculate realistic potential savings and provide specific, actionable steps.
    
    Return insights as a JSON array with this exact structure:
    [
      {
        "id": "unique-id",
        "type": "spending_pattern" | "savings_opportunity" | "risk_alert" | "goal_progress" | "investment_advice",
        "title": "Brief, actionable title",
        "description": "Detailed explanation with specific numbers and comparisons",
        "confidence": 0.85,
        "impact": "low" | "medium" | "high",
        "actionable_steps": ["Specific step 1", "Specific step 2", "Specific step 3"],
        "potential_savings": 150,
        "timeline": "immediate" | "weekly" | "monthly" | "quarterly",
        "category": "category name if relevant",
        "priority": 5
      }
    ]
    
    Only return valid JSON, no other text.
    `;

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseInsights(response);
    } catch (error) {
      console.error('Gemini enhanced insight generation failed:', error);
      return this.getFallbackInsights(filteredTransactions);
    }
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
      // Clean up the response - remove any markdown formatting
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.slice(7);
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.slice(0, -3);
      }
      
      const parsed = JSON.parse(cleanResponse);
      
      // Ensure each insight has an ID
      return Array.isArray(parsed) ? parsed.map((insight, index) => ({
        ...insight,
        id: insight.id || `insight-${Date.now()}-${index}`
      })) : [];
    } catch (error) {
      console.error('Failed to parse Gemini insights:', error);
      return [];
    }
  }

  private getFallbackInsights(transactions: PlaidTransaction[]): AIInsight[] {
    // Basic rule-based insights as fallback
    const insights: AIInsight[] = [];
    
    // Example: High grocery spending
    const grocerySpending = transactions
      .filter(t => t?.category?.includes('Groceries'))
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (grocerySpending > 500) {
      insights.push({
        id: `grocery-high-${Date.now()}`,
        type: 'spending_pattern',
        title: 'Higher than average grocery spending',
        description: `You spent $${grocerySpending.toFixed(2)} on groceries this month, which is above average.`,
        confidence: 0.8,
        impact: 'medium',
        actionable_steps: [
          'Consider meal planning to reduce food waste',
          'Look for store discounts and bulk buying opportunities',
          'Try shopping with a list to avoid impulse purchases'
        ],
        potential_savings: Math.round(grocerySpending * 0.15),
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
      'Housing': Math.round(income * 0.3),
      'Food': Math.round(income * 0.15),
      'Transportation': Math.round(income * 0.15),
      'Utilities': Math.round(income * 0.1),
      'Entertainment': Math.round(income * 0.05),
      'Savings': Math.round(income * 0.2),
      'Other': Math.round(income * 0.05)
    };
  }
}
