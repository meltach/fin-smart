import { NextRequest, NextResponse } from 'next/server';
import { getPlaidClient } from '@/services/plaidService';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
  }

  try {
    const plaidItem = await prisma.plaidItem.findFirst({
      where: { userId: userId },
    });

    if (plaidItem) {
      return NextResponse.json({ success: true, isConnected: true });
    } else {
      return NextResponse.json({ success: true, isConnected: false });
    }
  } catch (error) {
    console.error('Error checking Plaid connection status:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
