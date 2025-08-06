// Plaid API types for financial data
export interface PlaidAccount {
  account_id: string;
  balances: {
    available: number | null;
    current: number;
    limit: number | null;
    iso_currency_code: string;
    unofficial_currency_code?: string | null;
  };
  name: string;
  official_name: string | null;
  type: 'depository' | 'credit' | 'investment' | 'loan' | 'other';
  subtype: string;
  mask?: string;
  institution_id?: string;
}

export interface PlaidTransaction {
  description: string;
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string | null;
  category?: string[];
  category_id?: string;
  account_owner?: string | null;
  authorized_date?: string | null;
  authorized_datetime?: string | null;
  datetime?: string | null;
  iso_currency_code?: string | null;
  unofficial_currency_code?: string | null;
  check_number?: string | null;
  location?: {
    address?: string | null;
    city?: string | null;
    region?: string | null;
    postal_code?: string | null;
    country?: string | null;
    lat?: number | null;
    lon?: number | null;
    store_number?: string | null;
  };
  payment_meta?: {
    reference_number?: string | null;
    ppd_id?: string | null;
    payee?: string | null;
    by_order_of?: string | null;
    payer?: string | null;
    payment_method?: string | null;
    payment_processor?: string | null;
    reason?: string | null;
  };
  payment_channel?: 'online' | 'in store' | 'other';
  pending: boolean;
  pending_transaction_id?: string | null;
  personal_finance_category?: {
    primary: string;
    detailed: string;
    confidence_level?: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' | null;
  };
  personal_finance_category_icon_url?: string;
  transaction_type?: 'digital' | 'place' | 'special' | 'unresolved'; // deprecated but still present
  transaction_code?: string | null;
  logo_url?: string | null;
  website?: string | null;
  original_description?: string | null;
  counterparties?: Array<{
    name: string;
    entity_id?: string | null;
    type: 'merchant' | 'financial_institution' | 'payment_app' | 'marketplace' | 'payment_terminal' | 'income_source';
    website?: string | null;
    logo_url?: string | null;
    confidence_level?: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' | null;
  }>;
  merchant_entity_id?: string | null;
}

export interface PlaidInvestmentHolding {
  account_id: string;
  security_id: string;
  institution_price: number;
  institution_price_as_of?: string | null;
  institution_value: number;
  cost_basis?: number | null;
  quantity: number;
  iso_currency_code: string;
  unofficial_currency_code?: string | null;
}

export interface PlaidSecurity {
  security_id: string;
  isin?: string | null;
  cusip?: string | null;
  sedol?: string | null;
  institution_security_id?: string | null;
  institution_id?: string | null;
  proxy_security_id?: string | null;
  name: string;
  ticker_symbol?: string | null;
  is_cash_equivalent: boolean;
  type: string;
  close_price?: number | null;
  close_price_as_of?: string | null;
  iso_currency_code: string;
  unofficial_currency_code?: string | null;
}

export interface PlaidLiability {
  account_id: string;
  type: 'credit' | 'mortgage' | 'student';
  aprs?: Array<{
    apr_percentage: number;
    apr_type: string;
    balance_subject_to_apr?: number | null;
    interest_charge_amount?: number | null;
  }>;
  interest_rate_percentage?: number;
  last_payment_amount?: number;
  last_payment_date?: string;
  minimum_payment_amount?: number;
  next_payment_due_date?: string;
  origination_date?: string;
  origination_principal_amount?: number;
  outstanding_interest_amount?: number;
  payment_due_date?: string;
  ytd_interest_paid?: number;
  ytd_principal_paid?: number;
}

// Computed financial metrics
export interface FinancialMetrics {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyCashFlow: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  emergencyFundRatio: number;
  debtToIncomeRatio: number;
}

// App-specific types
export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
  category: 'emergency' | 'savings' | 'debt' | 'investment' | 'other';
  priority: 'high' | 'medium' | 'low';
}

export interface SpendingInsight {
  id: string;
  type: 'spending_spike' | 'unusual_merchant' | 'budget_exceeded' | 'savings_opportunity';
  title: string;
  description: string;
  amount?: number;
  category?: string;
  severity: 'info' | 'warning' | 'alert';
  date: string;
}

// Transaction sync response types
export interface PlaidSyncResponse {
  added: PlaidTransaction[];
  modified: PlaidTransaction[];
  removed: Array<{
    transaction_id: string;
    account_id: string;
  }>;
  next_cursor: string;
  has_more: boolean;
  accounts: PlaidAccount[];
  transactions_update_status?: 'TRANSACTIONS_UPDATE_STATUS_UNKNOWN' | 'NOT_READY' | 'INITIAL_UPDATE_COMPLETE' | 'HISTORICAL_UPDATE_COMPLETE';
  request_id: string;
}

export interface PlaidRemovedTransaction {
  transaction_id: string;
  account_id: string;
}
