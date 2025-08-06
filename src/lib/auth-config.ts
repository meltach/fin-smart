/**
 * Environment configuration validation for authentication
 */

interface AuthConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  nodeEnv: string;
  cookieDomain?: string;
}

/**
 * Validate authentication configuration
 */
export function validateAuthConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback-secret') {
    errors.push('JWT_SECRET is missing or using fallback value');
  }

  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'fallback-refresh-secret') {
    errors.push('JWT_REFRESH_SECRET is missing or using fallback value');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET should be at least 32 characters in production');
    }

    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
      errors.push('JWT_REFRESH_SECRET should be at least 32 characters in production');
    }
  }

  // Validate expiration formats
  const expiresInPattern = /^(\d+)([smhd])$/;
  if (process.env.JWT_EXPIRES_IN && !expiresInPattern.test(process.env.JWT_EXPIRES_IN)) {
    errors.push('JWT_EXPIRES_IN format is invalid. Use format like "15m", "1h", "1d"');
  }

  if (process.env.JWT_REFRESH_EXPIRES_IN && !expiresInPattern.test(process.env.JWT_REFRESH_EXPIRES_IN)) {
    errors.push('JWT_REFRESH_EXPIRES_IN format is invalid. Use format like "7d", "30d"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get authentication configuration
 */
export function getAuthConfig(): AuthConfig {
  return {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    nodeEnv: process.env.NODE_ENV || 'development',
    cookieDomain: process.env.COOKIE_DOMAIN,
  };
}

/**
 * Log configuration warnings on startup
 */
export function logAuthConfigWarnings(): void {
  const validation = validateAuthConfig();
  
  if (!validation.isValid) {
    console.warn('⚠️  Authentication Configuration Issues:');
    validation.errors.forEach(error => {
      console.warn(`   - ${error}`);
    });
  }

  if (process.env.NODE_ENV === 'production') {
    console.log('🔐 Authentication configured for production');
  } else {
    console.log('🔓 Authentication configured for development');
  }
}
