import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';

// Define User type from our schema since Prisma types aren't ready yet
export interface User {
  id: string;
  email: string;
  name: string | null;
  password: string;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  failedLoginCount: number;
  lockoutUntil: Date | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

// Parse JWT_EXPIRES_IN from string format (e.g., "15m") to seconds
function parseExpirationTime(timeStr: string, defaultSeconds: number): number {
  if (!timeStr) return defaultSeconds;
  
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) return defaultSeconds;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return defaultSeconds;
  }
}

const JWT_EXPIRES_IN = parseExpirationTime(process.env.JWT_EXPIRES_IN || '15m', 15 * 60); // 15 minutes in seconds
const JWT_REFRESH_EXPIRES_IN = parseExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN || '7d', 7 * 24 * 60 * 60); // 7 days in seconds

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'fin-smart',
    audience: 'fin-smart-app',
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'fin-smart',
    audience: 'fin-smart-app',
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(user: User): AuthTokens {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
  };
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    if (!isValidTokenFormat(token)) {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'fin-smart',
      audience: 'fin-smart-app',
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Access token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    if (!isValidTokenFormat(token)) {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'fin-smart',
      audience: 'fin-smart-app',
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Refresh token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Get token expiration date
 */
export function getTokenExpirationDate(expiresIn: string): Date {
  const now = new Date();
  const match = expiresIn.match(/^(\d+)([mhd])$/);
  
  if (!match) {
    throw new Error('Invalid expiration format');
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default:
      throw new Error('Invalid time unit');
  }
}

/**
 * Check if account is locked due to failed login attempts
 */
export function isAccountLocked(user: User): boolean {
  if (!user.lockoutUntil) return false;
  return new Date() < user.lockoutUntil;
}

/**
 * Calculate lockout duration based on failed attempts
 */
export function calculateLockoutDuration(failedAttempts: number): number {
  // Progressive lockout: 5 min, 15 min, 30 min, 1 hour, then 1 hour for each additional attempt
  const lockoutMinutes = Math.min(60, Math.pow(3, Math.min(failedAttempts - 3, 4)) * 5);
  return lockoutMinutes * 60 * 1000; // Convert to milliseconds
}

/**
 * Get standardized cookie options for authentication tokens
 */
export function getAuthCookieOptions(isRefreshToken: boolean = false) {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = isRefreshToken ? JWT_REFRESH_EXPIRES_IN : JWT_EXPIRES_IN;
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' as const : 'lax' as const,
    maxAge,
    path: '/',
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
  };
}

/**
 * Get cookie options for clearing auth cookies
 */
export function getClearCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' as const : 'lax' as const,
    maxAge: 0,
    path: '/',
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
  };
}

/**
 * Validate token format (basic JWT structure check)
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Check if each part is base64-like (contains valid characters)
  const base64Regex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => part.length > 0 && base64Regex.test(part));
}
