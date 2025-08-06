import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { 
  PlaidAccount, 
  PlaidTransaction, 
  PlaidInvestmentHolding,
  PlaidSecurity,
  PlaidLiability,
  FinancialMetrics,
  Goal,
  SpendingInsight 
} from '@/types/plaid';
import { AIInsight, FinancialForecast } from '@/services/geminiFinancialAdvisor';
import { authenticatedFetch } from '@/lib/utils';

interface FinancialState {
  // Raw Plaid data
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  investmentHoldings: PlaidInvestmentHolding[];
  securities: PlaidSecurity[];
  liabilities: PlaidLiability[];
  
  // App state
  goals: Goal[];
  insights: SpendingInsight[];
  aiInsights: AIInsight[];
  forecast: FinancialForecast | null;
  isLoading: boolean;
  isAIProcessing: boolean;
  lastSync: Date | null;
  lastAIAnalysis: Date | null;
  errors: string[];
  
  // UI preferences
  balancesVisible: boolean;
  selectedAccountIds: string[];
  dateRange: { start: Date; end: Date };
  aiInsightsEnabled: boolean;
  
  // Polling state
  pollInterval: NodeJS.Timeout | null;
  isPollingEnabled: boolean;
  
  // Computed metrics (will be calculated)
  metrics: FinancialMetrics;
}

interface FinancialActions {
  // Data setters
  setAccounts: (accounts: PlaidAccount[]) => void;
  setTransactions: (transactions: PlaidTransaction[]) => void;
  setInvestmentHoldings: (holdings: PlaidInvestmentHolding[]) => void;
  setSecurities: (securities: PlaidSecurity[]) => void;
  setLiabilities: (liabilities: PlaidLiability[]) => void;
  
  // Goals management
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  fetchGoals: () => Promise<void>;
  
  // Insights management
  setInsights: (insights: SpendingInsight[]) => void;
  dismissInsight: (id: string) => void;
  
  // AI Insights
  setAIInsights: (aiInsights: AIInsight[]) => void;
  analyzeWithAI: () => Promise<void>;
  
  // UI actions
  toggleBalancesVisible: () => void;
  setSelectedAccounts: (accountIds: string[]) => void;
  setDateRange: (range: { start: Date; end: Date }) => void;
  toggleAIInsights: () => void;
  
  // App actions
  setLoading: (loading: boolean) => void;
  setLastSync: (date: Date) => void;
  addError: (error: string) => void;
  clearErrors: () => void;
  
  // Polling actions
  startPolling: () => void;
  stopPolling: () => void;
  enablePolling: () => void;
  disablePolling: () => void;
  checkForUpdates: () => Promise<boolean>;
  
  // Computed actions
  calculateMetrics: () => void;
  refreshData: () => Promise<void>;
}

type FinancialStore = FinancialState & FinancialActions;

// Helper function to calculate financial metrics
const calculateFinancialMetrics = (state: FinancialState): FinancialMetrics => {
  const { accounts, transactions, liabilities } = state;
  
  // Calculate total assets (positive balances)
  const totalAssets = accounts
    .filter(acc => ['depository', 'investment'].includes(acc.type))
    .reduce((sum, acc) => sum + acc.balances.current, 0);
  
  // Calculate total liabilities (credit cards, loans)
  const totalLiabilities = accounts
    .filter(acc => ['credit', 'loan'].includes(acc.type))
    .reduce((sum, acc) => sum + Math.abs(acc.balances.current), 0);
  
  // Net worth
  const netWorth = totalAssets - totalLiabilities;
  
  // Calculate monthly cash flow (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTransactions = transactions.filter(t => 
    new Date(t.date) >= thirtyDaysAgo && !t.pending
  );
  
  const monthlyIncome = recentTransactions
    .filter(t => t.amount < 0) // Negative amounts are income in Plaid
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const monthlyExpenses = recentTransactions
    .filter(t => t.amount > 0) // Positive amounts are expenses
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyCashFlow = monthlyIncome - monthlyExpenses;
  
  // Emergency fund ratio (liquid assets / monthly expenses)
  const liquidAssets = accounts
    .filter(acc => acc.type === 'depository')
    .reduce((sum, acc) => sum + acc.balances.current, 0);
  
  const emergencyFundRatio = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;
  
  // Debt to income ratio
  const debtToIncomeRatio = monthlyIncome > 0 ? totalLiabilities / (monthlyIncome * 12) : 0;
  
  return {
    netWorth,
    totalAssets,
    totalLiabilities,
    monthlyCashFlow,
    monthlyIncome,
    monthlyExpenses,
    emergencyFundRatio,
    debtToIncomeRatio,
  };
};

export const useFinancialStore = create<FinancialStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        accounts: [],
        transactions: [],
        investmentHoldings: [],
        securities: [],
        liabilities: [],
        goals: [],
        insights: [],
        aiInsights: [],
        forecast: null,
        isLoading: false,
        isAIProcessing: false,
        lastSync: null,
        lastAIAnalysis: null,
        errors: [],
        balancesVisible: true,
        selectedAccountIds: [],
        aiInsightsEnabled: true,
        pollInterval: null,
        isPollingEnabled: true,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date(),
        },
        metrics: {
          netWorth: 0,
          totalAssets: 0,
          totalLiabilities: 0,
          monthlyCashFlow: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          emergencyFundRatio: 0,
          debtToIncomeRatio: 0,
        },

        // Data setters
        setAccounts: (accounts) => {
          set({ accounts });
          get().calculateMetrics();
        },

        setTransactions: (transactions) => {
          set({ transactions });
          get().calculateMetrics();
        },

        setInvestmentHoldings: (investmentHoldings) => {
          set({ investmentHoldings });
        },

        setSecurities: (securities) => {
          set({ securities });
        },

        setLiabilities: (liabilities) => {
          set({ liabilities });
          get().calculateMetrics();
        },

        // Goals management
        addGoal: async (goalData) => {
          try {
            // Make API call to create the goal
            const response = await authenticatedFetch('/api/goals', {
              method: 'POST',
              body: JSON.stringify(goalData),
            });

            if (!response.ok) {
              throw new Error('Failed to create goal');
            }

            const createdGoal = await response.json();

            // Only update local state if API call succeeds
            set((state) => ({ goals: [...state.goals, createdGoal] }));
          } catch (error) {
            // Add error handling
            get().addError(error instanceof Error ? error.message : 'Failed to create goal');
            throw error; // Re-throw so the UI can handle it
          }
        },

        updateGoal: async (id, updates) => {
          try {
            // Make API call to update the goal
            const response = await authenticatedFetch(`/api/goals/${id}`, {
              method: 'PUT',
              body: JSON.stringify(updates),
            });

            if (!response.ok) {
              throw new Error('Failed to update goal');
            }

            const updatedGoal = await response.json();

            // Only update local state if API call succeeds
            set((state) => ({
              goals: state.goals.map((goal) =>
                goal.id === id ? { ...goal, ...updatedGoal } : goal
              ),
            }));
          } catch (error) {
            // Add error handling
            get().addError(error instanceof Error ? error.message : 'Failed to update goal');
            throw error; // Re-throw so the UI can handle it
          }
        },

        fetchGoals: async () => {
          try {
            const response = await authenticatedFetch('/api/goals');
            
            if (!response.ok) {
              throw new Error('Failed to fetch goals');
            }

            const goals = await response.json();
            set({ goals });
          } catch (error) {
            get().addError(error instanceof Error ? error.message : 'Failed to fetch goals');
            throw error;
          }
        },

        deleteGoal: async (id) => {
          try {
            // Make API call to delete the goal
            const response = await authenticatedFetch(`/api/goals/${id}`, {
              method: 'DELETE',
            });

            if (!response.ok) {
              throw new Error('Failed to delete goal');
            }

            // Only update local state if API call succeeds
            set((state) => ({
              goals: state.goals.filter((goal) => goal.id !== id),
            }));
          } catch (error) {
            // Add error handling
            get().addError(error instanceof Error ? error.message : 'Failed to delete goal');
            throw error; // Re-throw so the UI can handle it
          }
        },

        // Insights management
        setInsights: (insights) => set({ insights }),

        dismissInsight: (id) => {
          set((state) => ({
            insights: state.insights.filter((insight) => insight.id !== id),
          }));
        },

        // AI Insights
        setAIInsights: (aiInsights) => set({ aiInsights }),

        analyzeWithAI: async () => {
          const { setAIInsights, addError, setLoading } = get();
          set({ isAIProcessing: true });
          setLoading(true);
          
          try {
            console.log('🤖 Requesting AI insights from server...');
            
            // Call the server-side AI insights API
            const response = await authenticatedFetch('/api/ai/insights', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`✅ Received ${result.insights?.length || 0} insights from ${result.aiProvider || 'unknown'} provider`);
            
            // Update state with AI insights
            setAIInsights(result.insights || []);
            
            // Update forecast if available
            if (result.forecast) {
              set({ forecast: result.forecast });
            }
            
            set({ lastAIAnalysis: new Date() });
            
          } catch (error) {
            console.error('AI analysis failed:', error);
            addError(error instanceof Error ? error.message : 'Failed to analyze data with AI');
            
            // Fallback to basic insights on error
            const fallbackInsights: AIInsight[] = [
              {
                id: Date.now().toString(),
                type: 'spending_pattern',
                title: 'Connect Your Data',
                description: 'Connect your financial accounts to get AI-powered insights.',
                confidence: 0.7,
                impact: 'medium',
                actionable_steps: ['Link bank accounts', 'Add recent transactions', 'Set financial goals'],
                priority: 5,
              },
            ];
            setAIInsights(fallbackInsights);
          } finally {
            set({ isAIProcessing: false });
            setLoading(false);
          }
        },

        // UI actions
        toggleBalancesVisible: () => {
          set((state) => ({ balancesVisible: !state.balancesVisible }));
        },

        setSelectedAccounts: (accountIds) => {
          set({ selectedAccountIds: accountIds });
        },

        setDateRange: (range) => {
          set({ dateRange: range });
        },

        toggleAIInsights: () => {
          set((state) => ({ aiInsightsEnabled: !state.aiInsightsEnabled }));
        },
        
        // App actions
        setLoading: (loading) => set({ isLoading: loading }),

        setLastSync: (date) => set({ lastSync: date }),

        addError: (error) => {
          set((state) => ({ errors: [...state.errors, error] }));
        },

        clearErrors: () => set({ errors: [] }),

        // Polling actions
        startPolling: () => {
          const { stopPolling, checkForUpdates, isPollingEnabled } = get();
          
          if (!isPollingEnabled) return;
          
          // Stop any existing polling
          stopPolling();
          
          const interval = setInterval(async () => {
            // Skip if tab is not active (saves bandwidth and API calls)
            if (typeof document !== 'undefined' && document.hidden) return;
            
            try {
              const hasUpdates = await checkForUpdates();
              if (hasUpdates) {
                console.log('🔄 New data detected via polling, refreshing...');
                get().refreshData();
              }
            } catch (error) {
              console.error('Error checking for updates:', error);
            }
          }, 120000); // Check every 2 minutes
          
          set({ pollInterval: interval });
          console.log('📡 Started data polling (2 min interval)');
        },

        stopPolling: () => {
          const { pollInterval } = get();
          if (pollInterval) {
            clearInterval(pollInterval);
            set({ pollInterval: null });
            console.log('📡 Stopped data polling');
          }
        },

        enablePolling: () => {
          set({ isPollingEnabled: true });
          get().startPolling();
        },

        disablePolling: () => {
          set({ isPollingEnabled: false });
          get().stopPolling();
        },

        checkForUpdates: async () => {
          const { lastSync } = get();
          if (!lastSync) return false;
          
          try {
            const response = await authenticatedFetch(`/api/data-version?since=${lastSync.getTime()}`);
            if (!response.ok) {
              throw new Error('Failed to check for updates');
            }
            
            const { hasUpdates } = await response.json();
            return hasUpdates;
          } catch (error) {
            console.error('Error checking for updates:', error);
            return false;
          }
        },

        // Computed actions
        calculateMetrics: () => {
          const state = get();
          const metrics = calculateFinancialMetrics(state);
          set({ metrics });
        },

        refreshData: async () => {
          const { setLoading, setLastSync, addError, setAccounts, setTransactions, lastSync } = get();
          
          // Prevent multiple rapid refresh calls (increased to 60 seconds)
          if (lastSync && (Date.now() - lastSync.getTime()) < 60 * 1000) {
            console.log('Data was recently refreshed, skipping refresh');
            return;
          }
          
          setLoading(true);
          
          try {
            console.log('Refreshing financial data...');
            
            // Use timeout for faster fallback
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            // Fetch real accounts from API
            const accountsResponse = await authenticatedFetch('/api/accounts', {
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (accountsResponse.ok) {
              const accountsData = await accountsResponse.json();
              console.log('Refreshed account data:', accountsData);
              
              if (accountsData && accountsData.length > 0) {
                // Transform database accounts to PlaidAccount format for compatibility
                const transformedAccounts = accountsData.map((account: any) => ({
                  account_id: account.providerAccountId || account.id,
                  name: account.accountName,
                  type: account.type,
                  subtype: account.type,
                  mask: account.accountNumber?.slice(-4) || null,
                  balances: {
                    current: account.balance || 0,
                    available: account.availableBalance || account.balance || 0,
                    limit: null,
                    iso_currency_code: account.currency || 'USD'
                  }
                }));
                
                setAccounts(transformedAccounts);
                
                // Only sync transactions if explicitly requested or no recent transactions
                const currentTransactions = get().transactions;
                if (currentTransactions.length === 0) {
                  try {
                    const transactionsResponse = await authenticatedFetch('/api/transactions?limit=50');
                    if (transactionsResponse.ok) {
                      const transactionsData = await transactionsResponse.json();
                      console.log('💳 Refreshed transactions:', transactionsData);
                      setTransactions(transactionsData.transactions || []);
                    }
                  } catch (syncError) {
                    console.error('❌ Error fetching transactions during refresh:', syncError);
                  }
                }
              }
            }
            
            setLastSync(new Date());
          } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
              console.error('Error refreshing data:', error);
              addError(error.message);
            } else if (error instanceof Error && error.name === 'AbortError') {
              console.log('Refresh timed out - continuing with existing data');
            } else {
              console.error('Unknown error refreshing data:', error);
              addError('Failed to refresh data');
            }
          } finally {
            setLoading(false);
          }
        },
      }),
      {
        name: 'financial-store',
        // Only persist UI preferences and goals, not sensitive financial data
        partialize: (state) => ({
          balancesVisible: state.balancesVisible,
          goals: state.goals,
          dateRange: state.dateRange,
          selectedAccountIds: state.selectedAccountIds,
          aiInsightsEnabled: state.aiInsightsEnabled,
          isPollingEnabled: state.isPollingEnabled,
        }),
      }
    ),
    { name: 'financial-store' }
  )
);
