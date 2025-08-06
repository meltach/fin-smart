import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, validateInput, corsHeaders } from '@/lib/middleware';
import { accountOperations, accountSchemas } from '@/lib/database';

/**
 * GET /api/accounts
 * Get user's accounts with recent transactions
 */
async function getAccounts(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    
    const accounts = await accountOperations.getUserAccountsWithTransactions(user.id);
    
    return NextResponse.json(accounts, { status: 200 });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve accounts', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounts
 * Create a new account
 */
async function createAccount(request: AuthenticatedRequest) {
  try {
    const user = request.user!;

    // Validate input
    const validation = await validateInput(accountSchemas.create)(request);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Create account
    const account = await accountOperations.createAccount({
      ...validation.data,
      userId: user.id
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/accounts/balances
 * Get account balances by type
 */
async function getBalances(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    
    const balances = await accountOperations.getTotalBalancesByType(user.id);
    
    return NextResponse.json(balances, { status: 200 });
  } catch (error) {
    console.error('Error fetching balances:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve balances', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/accounts
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin || undefined);
  return new NextResponse(null, { status: 200, headers });
}

// Export protected routes
export const GET = withAuth(getAccounts);
export const POST = withAuth(createAccount);
