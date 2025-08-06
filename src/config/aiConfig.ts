// Configuration for AI-powered financial insights
export interface AIConfig {
  enabled: boolean;
  provider: 'openai' | 'gemini' | 'anthropic' | 'local' | 'mock';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  features: {
    spendingAnalysis: boolean;
    budgetOptimization: boolean;
    investmentAdvice: boolean;
    goalPredictions: boolean;
    riskAssessment: boolean;
    savingsOpportunities: boolean;
  };
  analysisFrequency: 'realtime' | 'daily' | 'weekly' | 'manual';
  confidenceThreshold: number; // 0-1, minimum confidence to show insights
  maxInsights: number; // Maximum number of insights to show at once
}

export const defaultAIConfig: AIConfig = {
  enabled: true,
  provider: 'gemini', // Use Gemini as default
  features: {
    spendingAnalysis: true,
    budgetOptimization: true,
    investmentAdvice: false, // Requires more sophisticated analysis
    goalPredictions: true,
    riskAssessment: true,
    savingsOpportunities: true,
  },
  analysisFrequency: 'manual',
  confidenceThreshold: 0.7,
  maxInsights: 5,
};

// Environment-based configuration
export const getAIConfig = (): AIConfig => {
  const config = { ...defaultAIConfig };
  
  // Server-side configuration (has access to all env vars)
  if (typeof window === 'undefined') {
    config.provider = (process.env.NEXT_PUBLIC_AI_PROVIDER as any) || 'gemini';
    config.apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    config.baseUrl = process.env.AI_BASE_URL;
    config.model = process.env.AI_MODEL || (config.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4');
    config.enabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';
  } else {
    // Client-side configuration (only NEXT_PUBLIC_ vars available)
    config.provider = (process.env.NEXT_PUBLIC_AI_PROVIDER as any) || 'gemini';
    config.enabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';
    // Don't expose API keys on client-side
    config.apiKey = undefined;
    config.baseUrl = undefined;
    config.model = config.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4';
  }
  
  return config;
};

// Feature flags for different AI capabilities
export const AI_FEATURES = {
  // Basic features (ready for implementation)
  SPENDING_ANALYSIS: 'spending_analysis',
  SAVINGS_OPPORTUNITIES: 'savings_opportunities', 
  BUDGET_OPTIMIZATION: 'budget_optimization',
  GOAL_PREDICTIONS: 'goal_predictions',
  
  // Advanced features (future implementation)
  INVESTMENT_ADVICE: 'investment_advice',
  RISK_ASSESSMENT: 'risk_assessment',
  MARKET_ANALYSIS: 'market_analysis',
  TAX_OPTIMIZATION: 'tax_optimization',
  
  // Premium features (require subscription)
  PERSONALIZED_COACHING: 'personalized_coaching',
  REAL_TIME_ALERTS: 'real_time_alerts',
  CUSTOM_STRATEGIES: 'custom_strategies',
} as const;

export type AIFeature = typeof AI_FEATURES[keyof typeof AI_FEATURES];

// Cost estimates for different AI providers
export const AI_COST_ESTIMATES = {
  openai: {
    gpt4: 0.03, // per 1k tokens
    gpt35: 0.002,
  },
  gemini: {
    'gemini-1.5-pro': 0.001, // per 1k characters
    'gemini-1.5-flash': 0.0005,
  },
  anthropic: {
    claude3: 0.025,
    claude2: 0.015,
  },
  local: {
    cost: 0, // One-time setup cost only
  },
  mock: {
    cost: 0, // Free for development
  },
} as const;
