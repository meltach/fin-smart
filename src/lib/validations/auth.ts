import { z } from 'zod';

// User registration validation
export const registerSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must not exceed 100 characters'),
  
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    ),
  
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// User login validation
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  
  password: z
    .string()
    .min(1, 'Password is required'),
  
  rememberMe: z.boolean().optional(),
});

// Password reset request validation
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
});

// Password reset validation
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    ),
  
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Change password validation
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    ),
  
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }
);

// Update profile validation
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  
  avatar: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
});

// Two-factor authentication setup validation
export const twoFactorSetupSchema = z.object({
  token: z
    .string()
    .length(6, 'Two-factor code must be 6 digits')
    .regex(/^\d+$/, 'Two-factor code must contain only numbers'),
});

// Two-factor authentication verification
export const twoFactorVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'Two-factor code must be 6 digits')
    .regex(/^\d+$/, 'Two-factor code must contain only numbers'),
});

// Email verification
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Refresh token validation
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Types derived from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type TwoFactorSetupInput = z.infer<typeof twoFactorSetupSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
