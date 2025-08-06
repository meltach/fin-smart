import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware';

const prisma = new PrismaClient();

/**
 * GET /api/data-version?since=timestamp
 * Check if there are any data updates since the given timestamp
 */
async function getDataVersion(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const { searchParams } = new URL(request.url);
    const sinceTimestamp = searchParams.get('since');
    
    if (!sinceTimestamp) {
      return NextResponse.json({ error: 'Missing since parameter' }, { status: 400 });
    }

    const sinceDate = new Date(parseInt(sinceTimestamp));
    
    // Check if any transactions have been updated since the given timestamp
    const recentTransactions = await prisma.transaction.count({
      where: {
        userId: user.id,
        updatedAt: {
          gt: sinceDate
        }
      }
    });

    // Check if any accounts have been updated
    const recentAccounts = await prisma.account.count({
      where: {
        userId: user.id,
        updatedAt: {
          gt: sinceDate
        }
      }
    });

    // Check if any Plaid items have been synced recently
    const recentPlaidSync = await prisma.plaidItem.count({
      where: {
        userId: user.id,
        lastSyncAt: {
          gt: sinceDate
        }
      }
    });

    const hasUpdates = recentTransactions > 0 || recentAccounts > 0 || recentPlaidSync > 0;

    return NextResponse.json({
      hasUpdates,
      lastUpdate: hasUpdates ? new Date().toISOString() : null,
      counts: {
        transactions: recentTransactions,
        accounts: recentAccounts,
        plaidSyncs: recentPlaidSync
      }
    });

  } catch (error) {
    console.error('Error checking data version:', error);
    return NextResponse.json(
      { error: 'Failed to check for updates' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDataVersion);
