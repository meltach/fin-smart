import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, validateInput, corsHeaders } from '@/lib/middleware';
import { userOperations, userSchemas } from '@/lib/database';

/**
 * GET /api/user/profile
 * Get current user's profile with related data
 */
async function getProfile(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    
    // Get user with related data (accounts, goals, insights)
    const userWithRelations = await userOperations.getUserWithRelations(user.id);
    if (!userWithRelations) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const { password, twoFactorSecret, ...safeUser } = userWithRelations;

    return NextResponse.json(safeUser, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve profile', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
async function updateProfile(request: AuthenticatedRequest) {
  try {
    const user = request.user!;

    // Validate input
    const validation = await validateInput(userSchemas.update)(request);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await userOperations.updateUser(user.id, validation.data);
    
    // Remove sensitive data
    const { password, twoFactorSecret, ...safeUser } = updatedUser;

    return NextResponse.json(safeUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/user/profile
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin || undefined);
  return new NextResponse(null, { status: 200, headers });
}

// Export protected routes
export const GET = withAuth(getProfile);
export const PUT = withAuth(updateProfile);
