import { NextRequest, NextResponse } from 'next/server';
import { loginUser, AuthError } from '@/services/authService';
import { loginSchema } from '@/lib/validations/auth';
import { rateLimit, corsHeaders, validateInput } from '@/lib/middleware';
import { getAuthCookieOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers
    const origin = request.headers.get('origin');
    const headers = corsHeaders(origin || undefined);

    // Rate limiting
    const rateLimitResponse = rateLimit(5, 15 * 60 * 1000)(request); // 5 requests per 15 minutes
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate input
    const validation = await validateInput(loginSchema)(request);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400, headers }
      );
    }

    // Get IP and User Agent for security logging
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Attempt login
    const tokens = await loginUser(validation.data, ip, userAgent);

    // Create response with HTTP-only cookies
    const response = NextResponse.json(tokens, { status: 200, headers });
    
    // Set HTTP-only cookies for better security
    response.cookies.set('authToken', tokens.accessToken, getAuthCookieOptions(false));
    response.cookies.set('refreshToken', tokens.refreshToken, getAuthCookieOptions(true));

    return response;

  } catch (error) {
    console.error('Login API error:', error);

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
