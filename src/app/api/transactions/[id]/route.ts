import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, validateInput, corsHeaders } from '@/lib/middleware';
import { transactionOperations, transactionSchemas } from '@/lib/database';

/**
 * GET /api/transactions/[id]
 * Get specific transaction details
 */
async function getTransaction(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const transactionId = params.id;
    
    const transaction = await transactionOperations.getTransactionById(transactionId, user.id);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction, { status: 200 });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transaction', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/transactions/[id]
 * Update transaction details
 */
async function updateTransaction(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const transactionId = params.id;

    // Validate input
    const validation = await validateInput(transactionSchemas.update)(request);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Update transaction
    const transaction = await transactionOperations.updateTransaction(transactionId, user.id, validation.data);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction, { status: 200 });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/[id]
 * Delete transaction
 */
async function deleteTransaction(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const transactionId = params.id;

    const result = await transactionOperations.deleteTransaction(transactionId, user.id);
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/transactions/[id]
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin || undefined);
  return new NextResponse(null, { status: 200, headers });
}

// Export protected routes
export const GET = withAuth(getTransaction);
export const PUT = withAuth(updateTransaction);
export const DELETE = withAuth(deleteTransaction);
