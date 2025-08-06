import { prisma } from '@/lib/db';
import { 
  hashPassword, 
  verifyPassword, 
  generateTokens, 
  verifyRefreshToken,
  calculateLockoutDuration,
  isAccountLocked,
  getTokenExpirationDate,
  type AuthTokens,
  type User
} from '@/lib/auth';
import type { 
  RegisterInput, 
  LoginInput, 
  ChangePasswordInput, 
  UpdateProfileInput 
} from '@/lib/validations/auth';

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Register a new user
 */
export async function registerUser(input: RegisterInput): Promise<AuthTokens> {
  const { email, name, password } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    throw new AuthError('An account with this email already exists', 'EMAIL_EXISTS', 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      updatedAt: new Date(),
    },
  });

  // Generate tokens
  const tokens = generateTokens(user);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {     
      token: tokens.refreshToken,
      userId: user.id,
      expires: getTokenExpirationDate(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'user_register',
      resource: 'user',
      resourceId: user.id,
      details: { email: user.email, name: user.name },
    },
  });

  return tokens;
}

/**
 * Login user with email and password
 */
export async function loginUser(input: LoginInput, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
  const { email, password } = input;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AuthError('Account has been deactivated', 'ACCOUNT_DEACTIVATED', 401);
  }

  // Check if account is locked
  if (isAccountLocked(user)) {
    const lockoutMinutes = Math.ceil((user.lockoutUntil!.getTime() - Date.now()) / (1000 * 60));
    throw new AuthError(
      `Account is locked due to too many failed login attempts. Try again in ${lockoutMinutes} minutes.`,
      'ACCOUNT_LOCKED',
      423
    );
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);
  
  if (!isValidPassword) {
    // Increment failed login count
    const failedCount = user.failedLoginCount + 1;
    const lockoutDuration = failedCount >= 3 ? calculateLockoutDuration(failedCount) : null;
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failedCount,
        lockoutUntil: lockoutDuration ? new Date(Date.now() + lockoutDuration) : null,
      },
    });

    // Create audit log for failed login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'login_failed',
        resource: 'user',
        resourceId: user.id,
        details: { email: user.email, failedCount },
        ipAddress,
        userAgent,
      },
    });

    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  // Reset failed login count on successful login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
    },
  });

  // Generate tokens
  const tokens = generateTokens(user);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {    
      token: tokens.refreshToken,
      userId: user.id,
      expires: getTokenExpirationDate(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    },
  });

  // Create session
  await prisma.session.create({
    data: {
      sessionToken: tokens.accessToken,
      userId: user.id,
      expires: getTokenExpirationDate(process.env.JWT_EXPIRES_IN || '15m'),
      ipAddress,
      userAgent,
      updatedAt: new Date(),
    },
  });

  // Create audit log for successful login
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'login_success',
      resource: 'user',
      resourceId: user.id,
      details: { email: user.email },
      ipAddress,
      userAgent,
    },
  });

  return tokens;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw new AuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
  }

  // Check if refresh token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AuthError('Refresh token not found', 'REFRESH_TOKEN_NOT_FOUND', 401);
  }

  // Check if refresh token is expired
  if (storedToken.expires < new Date()) {
    // Delete expired token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw new AuthError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED', 401);
  }

  // Check if user is still active
  if (!storedToken.user.isActive) {
    throw new AuthError('Account has been deactivated', 'ACCOUNT_DEACTIVATED', 401);
  }

  // Generate new tokens
  const tokens = generateTokens(storedToken.user);

  // Delete old refresh token and create new one
  await prisma.$transaction([
    prisma.refreshToken.delete({
      where: { id: storedToken.id },
    }),
    prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        expires: getTokenExpirationDate(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
      },
    }),
  ]);

  return tokens;
}

/**
 * Logout user (invalidate refresh token)
 */
export async function logoutUser(refreshToken: string, userId?: string): Promise<void> {
  // Delete refresh token
  await prisma.refreshToken.deleteMany({
    where: {
      token: refreshToken,
      ...(userId && { userId }),
    },
  });

  // Create audit log
  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'logout',
        resource: 'user',
        resourceId: userId,
      },
    });
  }
}

/**
 * Logout user from all devices (invalidate all refresh tokens)
 */
export async function logoutAllDevices(userId: string): Promise<void> {
  // Delete all refresh tokens for user
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  // Delete all sessions for user
  await prisma.session.deleteMany({
    where: { userId },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'logout_all_devices',
      resource: 'user',
      resourceId: userId,
    },
  });
}

/**
 * Change user password
 */
export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const { currentPassword, newPassword } = input;

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AuthError('User not found', 'USER_NOT_FOUND', 404);
  }

  // Verify current password
  const isValidPassword = await verifyPassword(currentPassword, user.password);
  if (!isValidPassword) {
    throw new AuthError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD', 400);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Logout from all other devices (security measure)
  await logoutAllDevices(userId);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'password_change',
      resource: 'user',
      resourceId: userId,
    },
  });
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'profile_update',
      resource: 'user',
      resourceId: userId,
      details: input,
    },
  });

  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Deactivate user account
 */
export async function deactivateAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  // Logout from all devices
  await logoutAllDevices(userId);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'account_deactivate',
      resource: 'user',
      resourceId: userId,
    },
  });
}
