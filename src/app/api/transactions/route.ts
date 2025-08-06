import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, validateInput, corsHeaders } from '@/lib/middleware';
import { transactionOperations, transactionSchemas, paginationSchema } from '@/lib/database';

/**
 * GET /api/transactions
 * Get user's transactions with pagination and filtering
 */
async function getTransactions(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const accountId = searchParams.get('accountId') || undefined;
    const categoryParam = searchParams.get('category');
    const category = categoryParam ? categoryParam.split(',').map(c => c.trim()).filter(c => c.length > 0) : undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const filters = {
      accountId,
      category,
      startDate,
      endDate
    };

    const result = await transactionOperations.getTransactionsPaginated(
      user.id,
      page,
      limit,
      filters
    );
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transactions', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
async function createTransaction(request: AuthenticatedRequest) {
  try {
    const user = request.user!;

    // Validate input
    const validation = await validateInput(transactionSchemas.create)(request);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await transactionOperations.createTransaction({
      ...validation.data,
      userId: user.id
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/transactions
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin || undefined);
  return new NextResponse(null, { status: 200, headers });
}

// Export protected routes
export const GET = withAuth(getTransactions);
export const POST = withAuth(createTransaction);
