/**
 * Server-side Plaid service for secure API operations
 */
import { PlaidApi, Configuration, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { getPlaidConfig } from '@/config/plaidConfig';

// Sandbox test credentials for development
export const SANDBOX_TEST_CREDENTIALS = {
  phone: '+15555550123',
  username: 'user_good',
  password: 'pass_good',
  pin: '1234',
  // Common test institutions in sandbox
  institutions: {
    chase: 'ins_109508',
    wells_fargo: 'ins_109511',
    bank_of_america: 'ins_109512',
    capital_one: 'ins_109513'
  }
};

let plaidClient: PlaidApi | null = null;

export const getPlaidClient = (): PlaidApi => {
  if (!plaidClient) {
    const config = getPlaidConfig();
    
    const configuration = new Configuration({
      basePath: PlaidEnvironments[config.environment],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': config.clientId,
          'PLAID-SECRET': config.secret,
        },
      },
    });

    plaidClient = new PlaidApi(configuration);
  }

  return plaidClient;
};

/**
 * Create a link token for Plaid Link initialization
 */
export async function createLinkToken(userId: string, userEmail?: string) {
  const client = getPlaidClient();
  const config = getPlaidConfig();

  // Log sandbox instructions if in sandbox mode
  if (config.environment === 'sandbox') {
    console.log('🏦 Plaid Sandbox Mode Active');
    console.log('📱 When prompted for phone, use: +15555550123');
    console.log('🔑 Bank Login - Username: user_good, Password: pass_good, PIN: 1234');
  }

  try {
    const response = await client.linkTokenCreate({
      user: {
        client_user_id: userId,
        email_address: userEmail,
      },
      client_name: 'fin-smart',
      products: config.products as Products[],
      country_codes: config.countryCodes as CountryCode[],
      language: 'en',
      webhook: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhooks` : undefined,
    });

    return {
      success: true,
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    };
  } catch (error: any) {
    console.error('Error creating link token:', error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Exchange public token for access token
 */
export async function exchangePublicToken(publicToken: string) {
  const client = getPlaidClient();

  try {
    const response = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    return {
      success: true,
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Get accounts for an access token
 */
export async function getAccounts(accessToken: string) {
  const client = getPlaidClient();

  try {
    const response = await client.accountsGet({
      access_token: accessToken,
    });

    // Console log the data from Plaid
    console.log('🏦 PLAID ACCOUNTS DATA:', JSON.stringify(response.data, null, 2));
    console.log('📊 Number of accounts:', response.data.accounts.length);
    console.log('🏛️ Item info:', response.data.item);

    return {
      success: true,
      accounts: response.data.accounts,
      item: response.data.item,
    };
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Get transactions for an access token
 */
export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string,
  cursor?: string
) {
  const client = getPlaidClient();

  try {
    const response = await client.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });

    return {
      success: true,
      transactions: response.data.transactions,
      accounts: response.data.accounts,
      totalTransactions: response.data.total_transactions,
      cursor: response.data.transactions.length.toString(),
    };
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Get institution information
 */
export async function getInstitution(institutionId: string) {
  const client = getPlaidClient();

  try {
    const response = await client.institutionsGetById({
      institution_id: institutionId,
      country_codes: ['US', 'CA'] as CountryCode[],
    });

    // Console log the data from Plaid
    console.log('🏛️ PLAID INSTITUTION DATA:', JSON.stringify(response.data, null, 2));
    console.log('🏦 Institution name:', response.data.institution.name);
    console.log('🌐 Institution ID:', response.data.institution.institution_id);

    return {
      success: true,
      institution: response.data.institution,
    };
  } catch (error: any) {
    console.error('Error fetching institution:', error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Get sandbox-friendly user configuration
 */
export function getSandboxUserConfig(userId: string, userEmail?: string) {
  const config = getPlaidConfig();
  
  if (config.environment === 'sandbox') {
    return {
      client_user_id: userId,
      email_address: userEmail,
      phone_number: SANDBOX_TEST_CREDENTIALS.phone,
      phone_number_verified_time: new Date().toISOString(),
    };
  }
  
  return {
    client_user_id: userId,
    email_address: userEmail,
  };
}

/**
 * Remove/unlink an item (bank connection)
 */
export async function removeItem(accessToken: string) {
  const client = getPlaidClient();

  try {
    const response = await client.itemRemove({
      access_token: accessToken,
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error removing item:', error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Enhanced Plaid transaction sync using the /transactions/sync endpoint
 * This is the recommended approach for production applications
 */
export async function syncTransactionsIncremental(
  accessToken: string, 
  cursor?: string,
  count?: number
) {
  const client = getPlaidClient();

  try {
    const request: any = {
      access_token: accessToken,
      cursor: cursor,
    };

    // Add count if specified (max 500)
    if (count && count > 0 && count <= 500) {
      request.count = count;
    }

    const response = await client.transactionsSync(request);

    // Log sync details for debugging
    console.log(`📊 Sync result: +${response.data.added.length} ~${response.data.modified.length} -${response.data.removed.length}`);
    console.log(`📄 Has more: ${response.data.has_more}, Next cursor: ${response.data.next_cursor ? 'present' : 'none'}`);
    
    // Validate response structure
    if (!response.data.next_cursor) {
      console.warn('⚠️ Warning: next_cursor is missing from sync response');
    }

    return {
      success: true,
      added: response.data.added,
      modified: response.data.modified,
      removed: response.data.removed,
      nextCursor: response.data.next_cursor,
      hasMore: response.data.has_more,
      accounts: response.data.accounts,
      transactionsUpdateStatus: response.data.transactions_update_status,
      requestId: response.data.request_id,
    };
  } catch (error: any) {
    console.error('Error syncing transactions:', error);
    
    // Handle specific Plaid errors
    if (error.response?.data?.error_code) {
      const plaidError = error.response.data;
      console.error(`Plaid Error [${plaidError.error_code}]: ${plaidError.error_message}`);
      
      // Handle specific error codes
      if (plaidError.error_code === 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION') {
        console.warn('⚠️ Data mutation during pagination detected. Consider restarting sync.');
      }
    }
    
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Get historical transactions for initial sync (up to 2 years)
 */
export async function getHistoricalTransactions(
  accessToken: string,
  startDate?: string,
  endDate?: string
) {
  const client = getPlaidClient();
  
  // Default to last 2 years if no dates provided
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const response = await client.transactionsGet({
      access_token: accessToken,
      start_date: startDate || defaultStartDate,
      end_date: endDate || defaultEndDate,
      options: {
        count: 500, // Maximum per request
        offset: 0,
      },
    });

    let allTransactions = response.data.transactions;
    let totalTransactions = response.data.total_transactions;
    let offset = allTransactions.length;

    console.log(`📊 Initial fetch: ${allTransactions.length}/${totalTransactions} transactions`);

    // Fetch remaining transactions if there are more
    while (allTransactions.length < totalTransactions) {
      const additionalResponse = await client.transactionsGet({
        access_token: accessToken,
        start_date: startDate || defaultStartDate,
        end_date: endDate || defaultEndDate,
        options: {
          count: 500,
          offset: offset,
        },
      });

      // Break if no new transactions to avoid infinite loop
      if (additionalResponse.data.transactions.length === 0) {
        console.log('⚠️ No more transactions returned, breaking pagination loop');
        break;
      }

      allTransactions = [...allTransactions, ...additionalResponse.data.transactions];
      offset = allTransactions.length;
      
      console.log(`📊 Fetched batch: ${additionalResponse.data.transactions.length} transactions (total: ${allTransactions.length}/${totalTransactions})`);
    }

    console.log(`✅ Historical sync complete: ${allTransactions.length} transactions fetched`);

    return {
      success: true,
      transactions: allTransactions,
      accounts: response.data.accounts,
      totalTransactions: allTransactions.length,
    };
  } catch (error: any) {
    console.error('Error fetching historical transactions:', error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}
