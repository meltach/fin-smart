import { NextRequest, NextResponse } from 'next/server';
import { createLinkToken } from '@/services/plaidService';
import { validatePlaidConfig } from '@/config/plaidConfig';

export async function POST(request: NextRequest) {
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

    const { userId, userEmail } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await createLinkToken(userId, userEmail);

    if (result.success) {
      return NextResponse.json({
        success: true,
        linkToken: result.linkToken,
        expiration: result.expiration,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in create-link-token API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
