import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware';
import { insightOperations } from '@/lib/database/utils';

/**
 * GET /api/insights/type/[type]
 * Get insights by specific type
 */
async function getInsightsByType(request: AuthenticatedRequest, { params }: { params: { type: string } }) {
  try {
    const user = request.user!;
    const { type } = params;

    if (!type) {
      return NextResponse.json(
        { error: 'Insight type is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const insights = await insightOperations.getInsightsByType(user.id, decodeURIComponent(type));

    return NextResponse.json(insights, { status: 200 });
  } catch (error) {
    console.error('Error fetching insights by type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights by type', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Export handler with authentication
export const GET = withAuth(getInsightsByType);
