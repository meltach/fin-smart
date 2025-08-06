import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken, AuthError } from '@/services/authService';
import { refreshTokenSchema } from '@/lib/validations/auth';
import { corsHeaders, validateInput } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers
    const origin = request.headers.get('origin');
    const headers = corsHeaders(origin || undefined);

    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found', code: 'TOKEN_MISSING' },
        { status: 401, headers }
      );
    }

    // Refresh token
    const tokens = await refreshAccessToken(refreshToken);

    // Create response with new cookies
    const response = NextResponse.json(tokens, { status: 200, headers });
    
    // Update HTTP-only cookies with new tokens
    response.cookies.set('authToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });
    
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Token refresh API error:', error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: corsHeaders() }
      );
    }

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
