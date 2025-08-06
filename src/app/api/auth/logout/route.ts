import { NextRequest, NextResponse } from 'next/server';
import { logoutUser } from '@/services/authService';
import { refreshTokenSchema } from '@/lib/validations/auth';
import { corsHeaders, validateInput } from '@/lib/middleware';
import { getClearCookieOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers
    const origin = request.headers.get('origin');
    const headers = corsHeaders(origin || undefined);

    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (refreshToken) {
      // Logout user (invalidate refresh token)
      await logoutUser(refreshToken);
    }

    // Create response and clear cookies
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200, headers }
    );
    
    // Clear authentication cookies
    response.cookies.set('authToken', '', getClearCookieOptions());
    response.cookies.set('refreshToken', '', getClearCookieOptions());

    return response;

  } catch (error) {
    console.error('Logout API error:', error);

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(origin || undefined),
  });
}
