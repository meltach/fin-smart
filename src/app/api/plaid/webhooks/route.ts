import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { syncTransactionsIncremental } from '@/services/plaidService';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Webhook signature verification for production security
function verifyWebhookSignature(signature: string | null, body: string): boolean {
  if (!signature || !process.env.PLAID_WEBHOOK_VERIFICATION_KEY) {
    // Skip verification in development
    return process.env.NODE_ENV !== 'production';
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.PLAID_WEBHOOK_VERIFICATION_KEY)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * POST /api/plaid/webhooks
 * Handle Plaid webhooks for real-time transaction updates
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { webhook_type, webhook_code, item_id } = body;

    console.log(`🔔 Plaid webhook received: ${webhook_type}/${webhook_code} for item ${item_id}`);

    // Verify webhook signature in production
    const signature = request.headers.get('plaid-verification');
    if (!verifyWebhookSignature(signature, JSON.stringify(body))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    switch (webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionWebhook(body);
        break;
      
      case 'ITEM':
        await handleItemWebhook(body);
        break;
      
      case 'AUTH':
        await handleAuthWebhook(body);
        break;
      
      default:
        console.log(`⚠️ Unhandled webhook type: ${webhook_type}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook processed in ${processingTime}ms`);

    return NextResponse.json({ success: true });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Error processing Plaid webhook (${processingTime}ms):`, error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleTransactionWebhook(body: any) {
  const { webhook_code, item_id } = body;
  
  try {
    // Find the Plaid item in our database
    const plaidItem = await prisma.plaidItem.findFirst({
      where: { itemId: item_id },
      include: { accounts: true }
    });

    if (!plaidItem) {
      console.warn(`⚠️ Plaid item not found: ${item_id}`);
      return;
    }

    switch (webhook_code) {
      case 'SYNC_UPDATES_AVAILABLE':
        console.log(`🔄 Sync updates available for item: ${plaidItem.institutionName}`);
        
        // Trigger incremental sync
        let hasMore = true;
        let cursor = plaidItem.cursor || undefined;
        let totalSynced = 0;

        while (hasMore) {
          const syncResult = await syncTransactionsIncremental(plaidItem.accessToken, cursor);
          
          if (!syncResult.success) {
            console.error(`❌ Failed to sync transactions:`, syncResult.error);
            break;
          }

          // Process transactions (same logic as in sync route)
          if (syncResult.added) {
            for (const transaction of syncResult.added) {
              const account = plaidItem.accounts.find(acc => acc.accountId === transaction.account_id);
              if (account) {
                await upsertTransaction(transaction, account, plaidItem.userId);
                totalSynced++;
              }
            }
          }

          if (syncResult.modified) {
            for (const transaction of syncResult.modified) {
              const account = plaidItem.accounts.find(acc => acc.accountId === transaction.account_id);
              if (account) {
                await upsertTransaction(transaction, account, plaidItem.userId);
              }
            }
          }

          if (syncResult.removed) {
            for (const transaction of syncResult.removed) {
              await prisma.transaction.deleteMany({
                where: {
                  transactionId: transaction.transaction_id,
                  userId: plaidItem.userId
                }
              });
            }
          }

          cursor = syncResult.nextCursor;
          hasMore = syncResult.hasMore || false;
        }

        // Update cursor
        await prisma.plaidItem.update({
          where: { id: plaidItem.id },
          data: { 
            cursor: cursor,
            lastSyncAt: new Date() 
          }
        });

        console.log(`✅ Webhook sync complete: ${totalSynced} transactions processed`);
        break;

      case 'HISTORICAL_UPDATE':
        console.log(`📊 Historical update available for item: ${plaidItem.institutionName}`);
        // Could trigger a full resync here if needed
        break;

      default:
        console.log(`⚠️ Unhandled transaction webhook: ${webhook_code}`);
    }
  } catch (error) {
    console.error('❌ Error handling transaction webhook:', error);
  }
}

async function handleItemWebhook(body: any) {
  const { webhook_code, item_id, error } = body;
  
  try {
    const plaidItem = await prisma.plaidItem.findFirst({
      where: { itemId: item_id }
    });

    if (!plaidItem) {
      console.warn(`⚠️ Plaid item not found: ${item_id}`);
      return;
    }

    switch (webhook_code) {
      case 'ERROR':
        console.error(`❌ Item error for ${plaidItem.institutionName}:`, error);
        await prisma.plaidItem.update({
          where: { id: plaidItem.id },
          data: { 
            status: 'error',
            error: error 
          }
        });
        break;

      case 'PENDING_EXPIRATION':
        console.warn(`⚠️ Item pending expiration: ${plaidItem.institutionName}`);
        await prisma.plaidItem.update({
          where: { id: plaidItem.id },
          data: { status: 'requires_update' }
        });
        break;

      case 'USER_PERMISSION_REVOKED':
        console.warn(`🚫 User permission revoked: ${plaidItem.institutionName}`);
        await prisma.plaidItem.update({
          where: { id: plaidItem.id },
          data: { status: 'error' }
        });
        break;

      default:
        console.log(`⚠️ Unhandled item webhook: ${webhook_code}`);
    }
  } catch (error) {
    console.error('❌ Error handling item webhook:', error);
  }
}

async function handleAuthWebhook(body: any) {
  const { webhook_code, item_id } = body;
  console.log(`🔐 Auth webhook: ${webhook_code} for item ${item_id}`);
  // Handle auth-related webhooks as needed
}

// Helper function (shared with sync route - consider moving to utils)
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
        category: primaryCategory,
        subcategory: detailedCategory,
        description: description,
        date: new Date(transaction.date),
        merchantName: transaction.merchant_name,
        status: transaction.pending ? 'pending' : 'posted',
        originalDescription: originalDescription,
        plaidCategoryId: transaction.category_id,
        plaidAccountId: transaction.account_id,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        accountId: account.id,
        transactionId: transaction.transaction_id,
        amount: Math.abs(transaction.amount),
        type: transaction.amount > 0 ? 'debit' : 'credit', // Fixed: Plaid amounts are positive for outflows
        category: primaryCategory,
        subcategory: detailedCategory,
        description: description,
        date: new Date(transaction.date),
        merchantName: transaction.merchant_name,
        status: transaction.pending ? 'pending' : 'posted',
        originalDescription: originalDescription,
        plaidCategoryId: transaction.category_id,
        plaidAccountId: transaction.account_id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error(`❌ Error upserting transaction ${transaction.transaction_id}:`, error.message);
    console.error('Transaction data:', JSON.stringify(transaction, null, 2));
  }
}
