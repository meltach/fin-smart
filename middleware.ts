import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /login)
  const { pathname } = request.nextUrl;

  // Check if user has a token (in a real app, verify it)
  const token = request.cookies.get('authToken')?.value;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup'];

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If user is not authenticated and trying to access a protected route
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and trying to access login page
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
