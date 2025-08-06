/**
 * Plaid configuration for bank account connections
 */
import { Products } from 'plaid';

export interface PlaidConfig {
  clientId: string;
  secret: string;
  environment: 'sandbox' | 'development' | 'production';
  products: Products[];
  countryCodes: string[];
}

export const getPlaidConfig = (): PlaidConfig => {
  const environment = (process.env.PLAID_ENV || 'sandbox') as 'sandbox' | 'development' | 'production';
  
  return {
    clientId: process.env.PLAID_CLIENT_ID || '',
    secret: process.env.PLAID_SECRET || '',
    environment,
    products: [Products.Transactions, Products.Auth],
    countryCodes: ['US', 'CA'],
  };
};

export const getPlaidEnvironmentUrl = (env: string) => {
  switch (env) {
    case 'production':
      return 'https://production.plaid.com';
    case 'development':
      return 'https://development.plaid.com';
    case 'sandbox':
    default:
      return 'https://sandbox.plaid.com';
  }
};

/**
 * Validate Plaid configuration
 */
export function validatePlaidConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = getPlaidConfig();

  if (!config.clientId) {
    errors.push('PLAID_CLIENT_ID is required');
  }

  if (!config.secret) {
    errors.push('PLAID_SECRET is required');
  }

  if (!['sandbox', 'development', 'production'].includes(config.environment)) {
    errors.push('PLAID_ENV must be sandbox, development, or production');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Log Plaid configuration warnings on startup
 */
export function logPlaidConfigWarnings(): void {
  const validation = validatePlaidConfig();
  const config = getPlaidConfig();
  
  if (!validation.isValid) {
    console.warn('⚠️  Plaid Configuration Issues:');
    validation.errors.forEach(error => {
      console.warn(`   - ${error}`);
    });
    console.warn('   Get your Plaid credentials at: https://dashboard.plaid.com/');
  }

  console.log(`🏦 Plaid configured for ${config.environment} environment`);
  
  if (config.environment === 'sandbox') {
    console.log('📝 Using Plaid Sandbox - perfect for development and testing');
  }
}
