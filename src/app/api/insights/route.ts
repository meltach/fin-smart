import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, validateInput, corsHeaders } from '@/lib/middleware';
import { insightOperations } from '@/lib/database/utils';

/**
 * GET /api/insights
 * Get user's insights with filtering and pagination
 */
async function getInsights(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || undefined;
    const importance = searchParams.get('importance') || undefined;
    const isRead = searchParams.get('isRead') ? searchParams.get('isRead') === 'true' : undefined;
    const actionable = searchParams.get('actionable') ? searchParams.get('actionable') === 'true' : undefined;

    const filters = {
      ...(type && { type }),
      ...(importance && { importance }),
      ...(isRead !== undefined && { isRead }),
      ...(actionable !== undefined && { actionable })
    };

    const result = await insightOperations.getUserInsights(
      user.id,
      page,
      limit,
      Object.keys(filters).length > 0 ? filters : undefined
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/insights
 * Create a new insight
 */
async function createInsight(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    
    const {
      type,
      title,
      description,
      importance = 'medium',
      actionable = false,
      data,
      validUntil
    } = body;

    if (!type || !title || !description) {
      return NextResponse.json(
        { error: 'Type, title, and description are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const insight = await insightOperations.createInsight(
      user.id,
      type,
      title,
      description,
      importance,
      actionable,
      data,
      validUntil ? new Date(validUntil) : undefined
    );

    return NextResponse.json(insight, { status: 201 });
  } catch (error) {
    console.error('Error creating insight:', error);
    return NextResponse.json(
      { error: 'Failed to create insight', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/insights
 * Mark multiple insights as read
 */
async function markInsightsAsRead(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    const { insightIds } = body;

    if (!insightIds || !Array.isArray(insightIds)) {
      return NextResponse.json(
        { error: 'insightIds array is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    await insightOperations.markInsightsAsRead(user.id, insightIds);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error marking insights as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark insights as read', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withAuth(getInsights);
export const POST = withAuth(createInsight);
export const PATCH = withAuth(markInsightsAsRead);
