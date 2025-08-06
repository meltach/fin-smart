import { NextRequest, NextResponse } from 'next/server';
import { exchangePublicToken, getAccounts, getInstitution } from '@/services/plaidService';
import { PrismaClient } from '@prisma/client';
import { validatePlaidConfig } from '@/config/plaidConfig';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware';

const prisma = new PrismaClient();

async function handleExchangeToken(request: AuthenticatedRequest) {
  try {
    // Validate Plaid configuration
    const configValidation = validatePlaidConfig();
    if (!configValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Plaid not configured. Please check your environment variables.',
          details: configValidation.errors 
        },
        { status: 500 }
      );
    }

    const { publicToken, institutionId, institutionName, accounts } = await request.json();

    if (!publicToken) {
      return NextResponse.json(
        { success: false, error: 'Public token is required' },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const exchangeResult = await exchangePublicToken(publicToken);

    if (!exchangeResult.success) {
      return NextResponse.json(
        { success: false, error: exchangeResult.error },
        { status: 400 }
      );
    }

    const { accessToken, itemId } = exchangeResult;

    // Get detailed account information
    const accountsResult = await getAccounts(accessToken!);

    if (!accountsResult.success) {
      return NextResponse.json(
        { success: false, error: accountsResult.error },
        { status: 400 }
      );
    }

    // Get institution details
    let institutionData = null;
    if (institutionId) {
      const institutionResult = await getInstitution(institutionId);
      if (institutionResult.success) {
        institutionData = institutionResult.institution;
      }
    }

    // TODO: Get current user ID from session/auth
    // For now, we'll use a placeholder - replace this with actual auth
    const userId = request.user!.id; // Get user ID from authenticated request

    try {
      // Store Plaid item in database
      const plaidItem = await prisma.plaidItem.create({
        data: {
          userId,
          itemId: itemId!,
          accessToken: accessToken!, // TODO: Encrypt this in production
          institutionId: institutionId || 'unknown',
          institutionName: institutionName || institutionData?.name || 'Unknown Bank',
          status: 'active',
        },
      });

      // Store accounts in database
      const accountPromises = accountsResult.accounts!.map(async (account: any) => {
        return prisma.account.create({
          data: {
            userId,
            plaidItemId: plaidItem.id,
            type: account.type,
            provider: 'plaid',
            accountId: account.account_id,
            name: account.name,
            accountNumber: account.mask ? `****${account.mask}` : undefined,
            balance: account.balances.current || 0,
            availableBalance: account.balances.available,
            currency: account.balances.iso_currency_code || 'USD',
            isActive: true,
            lastSyncAt: new Date(),
          },
        });
      });

      await Promise.all(accountPromises);

      return NextResponse.json({
        success: true,
        itemId,
        institutionName: institutionName || institutionData?.name,
        accountsCount: accountsResult.accounts!.length,
        message: 'Bank account connected successfully!',
      });

    } catch (dbError: any) {
      console.error('Database error while storing Plaid data:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to store account data. Please try again.',
          details: dbError.message 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error in exchange-token API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export the authenticated route
export const POST = withAuth(handleExchangeToken);
