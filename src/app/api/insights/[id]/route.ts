import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware';
import { insightOperations } from '@/lib/database/utils';

/**
 * GET /api/insights/[id]
 * Get a specific insight by ID
 */
async function getInsight(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Insight ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const insight = await insightOperations.getInsightById(id, user.id);

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(insight, { status: 200 });
  } catch (error) {
    console.error('Error fetching insight:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insight', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/insights/[id]
 * Update a specific insight
 */
async function updateInsight(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Insight ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      importance,
      actionable,
      isRead,
      data,
      validUntil
    } = body;

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(importance && { importance }),
      ...(actionable !== undefined && { actionable }),
      ...(isRead !== undefined && { isRead }),
      ...(data && { data }),
      ...(validUntil && { validUntil: new Date(validUntil) })
    };

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const insight = await insightOperations.updateInsight(id, user.id, updateData);

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found or unauthorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(insight, { status: 200 });
  } catch (error) {
    console.error('Error updating insight:', error);
    return NextResponse.json(
      { error: 'Failed to update insight', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/insights/[id]
 * Delete a specific insight
 */
async function deleteInsight(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Insight ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const result = await insightOperations.deleteInsight(id, user.id);

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Insight not found or unauthorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting insight:', error);
    return NextResponse.json(
      { error: 'Failed to delete insight', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/insights/[id]
 * Mark a specific insight as read
 */
async function markInsightAsRead(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const user = request.user!;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Insight ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const result = await insightOperations.markInsightAsRead(id, user.id);

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Insight not found or unauthorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error marking insight as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark insight as read', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withAuth(getInsight);
export const PUT = withAuth(updateInsight);
export const DELETE = withAuth(deleteInsight);
export const PATCH = withAuth(markInsightAsRead);
