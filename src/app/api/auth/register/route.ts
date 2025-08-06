import { NextRequest, NextResponse } from 'next/server';
import { registerUser, AuthError } from '@/services/authService';
import { registerSchema } from '@/lib/validations/auth';
import { rateLimit, corsHeaders, validateInput } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers
    const origin = request.headers.get('origin');
    const headers = corsHeaders(origin || undefined);

    // Rate limiting - stricter for registration
    const rateLimitResponse = rateLimit(10, 15 * 60 * 1000)(request); // 10 requests per 15 minutes (relaxed for development)
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate input
    const validation = await validateInput(registerSchema)(request);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400, headers }
      );
    }

    // Register user
    const tokens = await registerUser(validation.data);

    // Create response with HTTP-only cookies
    const response = NextResponse.json(tokens, { status: 201, headers });
    
    // Set HTTP-only cookies for better security
    response.cookies.set('authToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });
    
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Registration API error:', error);

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
