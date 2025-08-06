import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware';
import { insightOperations } from '@/lib/database/utils';

/**
 * GET /api/insights/stats
 * Get insight statistics for the current user
 */
async function getInsightStats(request: AuthenticatedRequest) {
  try {
    const user = request.user!;

    // Get unread count
    const unreadCount = await insightOperations.getUnreadInsightsCount(user.id);

    // Get insights by type (for the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all insights to calculate statistics
    const allInsights = await insightOperations.getUserInsights(user.id, 1, 1000);
    
    const stats = {
      unreadCount,
      totalCount: allInsights.pagination.total,
      byImportance: {
        high: 0,
        medium: 0,
        low: 0
      },
      byType: {} as Record<string, number>,
      actionableCount: 0,
      recentCount: 0 // insights from last 7 days
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Calculate statistics
    allInsights.insights.forEach(insight => {
      // Count by importance
      stats.byImportance[insight.importance as keyof typeof stats.byImportance]++;
      
      // Count by type
      stats.byType[insight.type] = (stats.byType[insight.type] || 0) + 1;
      
      // Count actionable insights
      if (insight.actionable) {
        stats.actionableCount++;
      }
      
      // Count recent insights
      if (insight.createdAt >= sevenDaysAgo) {
        stats.recentCount++;
      }
    });

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching insight stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insight statistics', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Export handler with authentication
export const GET = withAuth(getInsightStats);
