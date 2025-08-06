import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware';
import { syncTransactionsIncremental, getHistoricalTransactions } from '@/services/plaidService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to upsert transaction with enhanced field mapping
async function upsertTransaction(transaction: any, account: any, userId: string) {
  try {
    // Use personal_finance_category if available, fallback to legacy category
    const primaryCategory = transaction.personal_finance_category?.primary || transaction.category?.[0] || 'Other';
    const detailedCategory = transaction.personal_finance_category?.detailed || transaction.category?.[1] || null;
    
    // Use merchant_name (preferred) or name as description
    const description = transaction.merchant_name || transaction.name || 'Transaction';
    
    // Store original description if available
    const originalDescription = transaction.original_description || null;
    
    await prisma.transaction.upsert({
      where: {
        transactionId: transaction.transaction_id,
      },
      update: {
        amount: Math.abs(transaction.amount),
        type: transaction.amount > 0 ? 'debit' : 'credit', // Fixed: Plaid amounts are positive for outflows
        category: transaction.category || [primaryCategory],
        subcategory: detailedCategory,
        description: description,
        name: transaction.name,
        merchantName: transaction.merchant_name,
        personalFinanceCategory: transaction.personal_finance_category,
        date: new Date(transaction.date),
        status: transaction.pending ? 'pending' : 'posted',
        originalDescription: originalDescription,
        plaidCategoryId: transaction.category_id,
        accountIdRef: transaction.account_id,
        authorizedDate: transaction.authorized_date,
        authorizedDatetime: transaction.authorized_datetime ? new Date(transaction.authorized_datetime) : null,
        isoCurrencyCode: transaction.iso_currency_code,
        unofficialCurrencyCode: transaction.unofficial_currency_code,
        checkNumber: transaction.check_number,
        location: transaction.location,
        paymentMeta: transaction.payment_meta,
        counterparties: transaction.counterparties || [],
        logoUrl: transaction.logo_url,
        website: transaction.website,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        accountId: account.id,
        transactionId: transaction.transaction_id,
        amount: Math.abs(transaction.amount),
        type: transaction.amount > 0 ? 'debit' : 'credit', // Fixed: Plaid amounts are positive for outflows
        category: transaction.category || [primaryCategory],
        subcategory: detailedCategory,
        description: description,
        name: transaction.name,
        merchantName: transaction.merchant_name,
        personalFinanceCategory: transaction.personal_finance_category,
        date: new Date(transaction.date),
        status: transaction.pending ? 'pending' : 'posted',
        originalDescription: originalDescription,
        plaidCategoryId: transaction.category_id,
        accountIdRef: transaction.account_id,
        authorizedDate: transaction.authorized_date,
        authorizedDatetime: transaction.authorized_datetime ? new Date(transaction.authorized_datetime) : null,
        isoCurrencyCode: transaction.iso_currency_code,
        unofficialCurrencyCode: transaction.unofficial_currency_code,
        checkNumber: transaction.check_number,
        location: transaction.location,
        paymentMeta: transaction.payment_meta,
        counterparties: transaction.counterparties || [],
        logoUrl: transaction.logo_url,
        website: transaction.website,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error(`❌ Error upserting transaction ${transaction.transaction_id}:`, error.message);
    // Log the transaction data for debugging
    console.error('Transaction data:', JSON.stringify(transaction, null, 2));
  }
}

async function syncPlaidData(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    
    console.log('🔄 Starting Plaid data sync for user:', user.id);
    
    // Get all active Plaid items for the user
    const plaidItems = await prisma.plaidItem.findMany({
      where: {
        userId: user.id,
        status: 'active'
      },
      include: {
        accounts: true
      }
    });

    if (plaidItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Plaid accounts to sync',
        synced: 0
      });
    }

    let totalTransactionsSynced = 0;
    
    // Sync transactions for each Plaid item
    for (const item of plaidItems) {
      console.log(`📱 Syncing item: ${item.institutionName} (${item.itemId})`);
      
      try {
        let hasMore = true;
        let cursor = item.cursor || undefined;
        let itemTransactionsSynced = 0;

        // If no cursor exists, do initial historical sync
        if (!cursor) {
          console.log(`🔄 Initial sync for ${item.institutionName} - fetching historical data`);
          const historicalResult = await getHistoricalTransactions(item.accessToken);
          
          if (historicalResult.success && historicalResult.transactions) {
            // Process historical transactions
            for (const transaction of historicalResult.transactions) {
              const account = item.accounts.find(acc => acc.accountId === transaction.account_id);
              if (account) {
                await upsertTransaction(transaction, account, user.id);
                itemTransactionsSynced++;
              }
            }
          }
        }

        // Incremental sync using /transactions/sync
        while (hasMore) {
          const syncResult = await syncTransactionsIncremental(item.accessToken, cursor);
          
          if (!syncResult.success) {
            console.error(`❌ Failed to sync transactions for ${item.institutionName}:`, syncResult.error);
            break;
          }

          console.log(`📊 Sync batch: +${syncResult.added?.length || 0} ~${syncResult.modified?.length || 0} -${syncResult.removed?.length || 0}`);

          // Process added transactions
          if (syncResult.added) {
            for (const transaction of syncResult.added) {
              const account = item.accounts.find(acc => acc.accountId === transaction.account_id);
              if (account) {
                await upsertTransaction(transaction, account, user.id);
                itemTransactionsSynced++;
              }
            }
          }

          // Process modified transactions
          if (syncResult.modified) {
            for (const transaction of syncResult.modified) {
              const account = item.accounts.find(acc => acc.accountId === transaction.account_id);
              if (account) {
                await upsertTransaction(transaction, account, user.id);
              }
            }
          }

          // Process removed transactions
          if (syncResult.removed) {
            for (const transaction of syncResult.removed) {
              await prisma.transaction.deleteMany({
                where: {
                  transactionId: transaction.transaction_id,
                  userId: user.id
                }
              });
            }
          }

          cursor = syncResult.nextCursor;
          hasMore = syncResult.hasMore || false;
        }

        // Update sync cursor and last sync time
        await prisma.plaidItem.update({
          where: { id: item.id },
          data: { 
            cursor: cursor,
            lastSyncAt: new Date() 
          }
        });

        totalTransactionsSynced += itemTransactionsSynced;
        console.log(`✅ ${item.institutionName}: Synced ${itemTransactionsSynced} transactions`);

      } catch (itemError: any) {
        console.error(`❌ Error syncing item ${item.institutionName}:`, itemError.message);
      }
    }
    
    console.log(`✅ Sync complete! Synced ${totalTransactionsSynced} new transactions`);
    
    return NextResponse.json({
      success: true,
      message: `Synced ${totalTransactionsSynced} new transactions`,
      synced: totalTransactionsSynced,
      items: plaidItems.length
    });
    
  } catch (error: any) {
    console.error('❌ Error during Plaid sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync Plaid data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(syncPlaidData);
