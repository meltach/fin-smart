import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';
import { getUserById } from '@/services/authService';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
}

/**
 * Middleware to authenticate requests
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  user?: AuthenticatedRequest['user'];
  error?: string;
}> {
  try {
    // Try to get token from Authorization header first, then from cookies
    const authHeader = request.headers.get('authorization');
    let token = extractTokenFromHeader(authHeader);
    
    // If no header token, try cookie
    if (!token) {
      token = request.cookies.get('authToken')?.value || null;
    }

    if (!token) {
      return {
        isAuthenticated: false,
        error: 'No authentication token provided',
      };
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return {
        isAuthenticated: false,
        error: 'Invalid or expired token',
      };
    }

    // Get user from database
    const user = await getUserById(decoded.userId);
    if (!user || !user.isActive) {
      return {
        isAuthenticated: false,
        error: 'User not found or account deactivated',
      };
    }

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      isAuthenticated: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Enhanced authentication request handler with better error handling
 */
export async function authenticateRequestSafe(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  user?: AuthenticatedRequest['user'];
  error?: string;
  errorCode?: string;
}> {
  try {
    // Try to get token from Authorization header first, then from cookies
    const authHeader = request.headers.get('authorization');
    let token = extractTokenFromHeader(authHeader);
    
    // If no header token, try cookie
    if (!token) {
      token = request.cookies.get('authToken')?.value || null;
    }

    if (!token) {
      return {
        isAuthenticated: false,
        error: 'No authentication token provided',
        errorCode: 'NO_TOKEN',
      };
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return {
        isAuthenticated: false,
        error: 'Invalid or expired token',
        errorCode: 'INVALID_TOKEN',
      };
    }

    // Get user from database with error handling
    let user;
    try {
      user = await getUserById(decoded.userId);
    } catch (dbError) {
      console.error('Database error during authentication:', dbError);
      return {
        isAuthenticated: false,
        error: 'Database connection error',
        errorCode: 'DATABASE_ERROR',
      };
    }

    if (!user) {
      return {
        isAuthenticated: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      };
    }

    if (!user.isActive) {
      return {
        isAuthenticated: false,
        error: 'Account deactivated',
        errorCode: 'ACCOUNT_DEACTIVATED',
      };
    }

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      isAuthenticated: false,
      error: 'Authentication failed',
      errorCode: 'AUTH_ERROR',
    };
  }
}

/**
 * Middleware factory for protecting API routes
 */
export function withAuth(handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const auth = await authenticateRequest(req);

    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { 
          error: auth.error || 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED' 
        },
        { status: 401 }
      );
    }

    // Add user to request object
    (req as AuthenticatedRequest).user = auth.user;

    return handler(req as AuthenticatedRequest, ...args);
  };
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function rateLimit(
  maxRequests: number = 10,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return (req: NextRequest): NextResponse | null => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    
    const userLimit = rateLimitMap.get(ip);
    
    if (!userLimit) {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
      return null;
    }

    // Reset count if window has passed
    if (now - userLimit.lastReset > windowMs) {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
      return null;
    }

    // Check if limit exceeded
    if (userLimit.count >= maxRequests) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((windowMs - (now - userLimit.lastReset)) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((windowMs - (now - userLimit.lastReset)) / 1000).toString(),
          }
        }
      );
    }

    // Increment count
    userLimit.count++;
    return null;
  };
}

/**
 * CORS middleware for API routes
 */
export function corsHeaders(origin?: string): Headers {
  const headers = new Headers();
  
  // Allow specific origins in production, multiple localhost ports in development
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.NEXTAUTH_URL || 'http://localhost:3000']
    : [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ];
  
  const requestOrigin = origin || 'http://localhost:3000';
  const isAllowed = process.env.NODE_ENV !== 'production' || allowedOrigins.includes(requestOrigin);
  
  if (isAllowed) {
    headers.set('Access-Control-Allow-Origin', requestOrigin);
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return headers;
}

/**
 * Input validation middleware
 */
export function validateInput<T>(
  schema: { parse: (data: unknown) => T }
) {
  return async (req: NextRequest): Promise<{ data: T; error?: string }> => {
    try {
      const body = await req.json();
      const data = schema.parse(body);
      if (!data) {
        throw new Error('Invalid input data');
      }
      return { data };
    } catch (error) {
      if (error instanceof Error) {
        return { data: {} as T, error: error.message };
      }
      return { data: {} as T, error: 'Invalid input data' };
    }
  };
}
