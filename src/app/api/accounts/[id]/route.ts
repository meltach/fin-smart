import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, validateInput, corsHeaders } from '@/lib/middleware';
import { accountOperations, accountSchemas } from '@/lib/database';

/**
 * GET /api/accounts/[id]
 * Get specific account details
 */
async function getAccount(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const accountId = params.id;
    
    const account = await accountOperations.getAccountById(accountId, user.id);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(account, { status: 200 });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve account', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/accounts/[id]
 * Update account details
 */
async function updateAccount(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const accountId = params.id;

    // Validate input
    const validation = await validateInput(accountSchemas.update)(request);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Update account
    const account = await accountOperations.updateAccount(accountId, user.id, validation.data);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(account, { status: 200 });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/accounts/[id]
 * Deactivate account (soft delete)
 */
async function deleteAccount(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const accountId = params.id;

    const account = await accountOperations.deactivateAccount(accountId, user.id);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Account deactivated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/accounts/[id]
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin || undefined);
  return new NextResponse(null, { status: 200, headers });
}

// Export protected routes
export const GET = withAuth(getAccount);
export const PUT = withAuth(updateAccount);
export const DELETE = withAuth(deleteAccount);
