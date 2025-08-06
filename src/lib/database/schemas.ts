import { z } from 'zod';

/**
 * Database validation schemas for input validation and type safety
 */

// User validation schemas
export const userSchemas = {
  create: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    avatar: z.string().url().optional(),
  }),

  update: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    avatar: z.string().url().optional(),
    twoFactorEnabled: z.boolean().optional(),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
};

// Account validation schemas
export const accountSchemas = {
  create: z.object({
    type: z.enum(['checking', 'savings', 'credit', 'investment'], {
      required_error: 'Account type is required',
    }),
    subtype: z.string().optional(),
    provider: z.enum(['plaid', 'manual'], {
      required_error: 'Provider is required',
    }),
    name: z.string().min(1, 'Account name is required').max(100, 'Account name too long'),
    official_name: z.string().optional(),
    account_id: z.string().optional(), // Plaid account ID
    mask: z.string().max(10).optional(),
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    balance: z.number().default(0),
    availableBalance: z.number().optional(),
    balances: z.any().optional(), // Plaid balances object
    currency: z.string().default('USD'),
    institution_id: z.string().optional(),
  }),

  update: z.object({
    name: z.string().min(1, 'Account name is required').max(100, 'Account name too long').optional(),
    subtype: z.string().optional(),
    account_id: z.string().optional(),
    official_name: z.string().optional(),
    mask: z.string().max(10).optional(),
    balance: z.number().optional(),
    availableBalance: z.number().optional(),
    balances: z.any().optional(),
    currency: z.string().optional(),
    institution_id: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
};

// Transaction validation schemas
export const transactionSchemas = {
  create: z.object({
    accountId: z.string().cuid('Invalid account ID'),
    amount: z.number().refine(
      (val) => val !== 0,
      'Transaction amount cannot be zero'
    ),
    description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
    name: z.string().max(200, 'Transaction name too long').optional(),
    category: z.array(z.string()).default([]), // Changed to array for Plaid compatibility
    subcategory: z.string().max(50, 'Subcategory too long').optional(),
    personal_finance_category: z.any().optional(), // Plaid's enhanced categorization
    type: z.enum(['debit', 'credit'], {
      required_error: 'Transaction type is required',
    }),
    status: z.enum(['pending', 'posted', 'cancelled']).default('posted'),
    merchant_name: z.string().max(100, 'Merchant name too long').optional(),
    date: z.date().default(() => new Date()),
    authorized_date: z.string().optional(),
    authorized_datetime: z.date().optional(),
    iso_currency_code: z.string().max(3).optional(),
    unofficial_currency_code: z.string().max(10).optional(),
    check_number: z.string().max(50).optional(),
    location: z.any().optional(), // Plaid location object
    payment_meta: z.any().optional(), // Plaid payment metadata
    counterparties: z.array(z.any()).default([]),
    logo_url: z.string().url().optional(),
    website: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
  }),

  update: z.object({
    description: z.string().min(1, 'Description is required').max(500, 'Description too long').optional(),
    name: z.string().max(200, 'Transaction name too long').optional(),
    category: z.array(z.string()).optional(),
    subcategory: z.string().max(50, 'Subcategory too long').optional(),
    personal_finance_category: z.any().optional(),
    merchant_name: z.string().max(100, 'Merchant name too long').optional(),
    authorized_date: z.string().optional(),
    authorized_datetime: z.date().optional(),
    iso_currency_code: z.string().max(3).optional(),
    location: z.any().optional(),
    payment_meta: z.any().optional(),
    counterparties: z.array(z.any()).optional(),
    logo_url: z.string().url().optional(),
    website: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
  }),

  filter: z.object({
    accountId: z.string().cuid().optional(),
    category: z.array(z.string()).optional(), // Updated for array format
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
    type: z.enum(['debit', 'credit']).optional(),
    status: z.enum(['pending', 'posted', 'cancelled']).optional(),
  }),
};

// Goal validation schemas
export const goalSchemas = {
  create: z.object({
    name: z.string().min(1, 'Goal name is required').max(100, 'Goal name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    target: z.number().positive('Target amount must be positive'),
    current: z.number().min(0, 'Current amount cannot be negative').default(0),
    deadline: z.preprocess(
      (val) => typeof val === 'string' ? new Date(val) : val,
      z.date().refine(
        (date) => date > new Date(),
        'Target date must be in the future'
      )
    ),
    category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
  }),

  update: z.object({
    name: z.string().min(1, 'Goal name is required').max(100, 'Goal name too long').optional(),
    description: z.string().max(500, 'Description too long').optional(),
    target: z.number().positive('Target amount must be positive').optional(),
    current: z.number().min(0, 'Current amount cannot be negative').optional(),
    deadline: z.preprocess(
      (val) => typeof val === 'string' ? new Date(val) : val,
      z.date().refine(
        (date) => date > new Date(),
        'Target date must be in the future'
      )
    ).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    isCompleted: z.boolean().optional(),
  }),
};

// Insight validation schemas
export const insightSchemas = {
  create: z.object({
    type: z.string().min(1, 'Insight type is required').max(50, 'Type too long'),
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
    importance: z.enum(['low', 'medium', 'high']).default('medium'),
    actionable: z.boolean().default(false),
    data: z.any().optional(),
    validUntil: z.date().optional(),
  }),

  update: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
    description: z.string().min(1, 'Description is required').max(1000, 'Description too long').optional(),
    importance: z.enum(['low', 'medium', 'high']).optional(),
    actionable: z.boolean().optional(),
    isRead: z.boolean().optional(),
    data: z.any().optional(),
    validUntil: z.date().optional(),
  }),

  filters: z.object({
    type: z.string().optional(),
    importance: z.enum(['low', 'medium', 'high']).optional(),
    isRead: z.boolean().optional(),
    actionable: z.boolean().optional(),
  }),

  markAsRead: z.object({
    insightIds: z.array(z.string().cuid()).min(1, 'At least one insight ID is required'),
  }),
};

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.startDate <= data.endDate,
  'Start date must be before or equal to end date'
);

// Common ID validation
export const idSchema = z.string().cuid('Invalid ID format');

// Export all schemas for convenience
export const dbSchemas = {
  user: userSchemas,
  account: accountSchemas,
  transaction: transactionSchemas,
  goal: goalSchemas,
  insight: insightSchemas,
  pagination: paginationSchema,
  dateRange: dateRangeSchema,
  id: idSchema,
};

// Type exports for use in API routes
export type CreateUserInput = z.infer<typeof userSchemas.create>;
export type UpdateUserInput = z.infer<typeof userSchemas.update>;
export type CreateAccountInput = z.infer<typeof accountSchemas.create>;
export type UpdateAccountInput = z.infer<typeof accountSchemas.update>;
export type CreateTransactionInput = z.infer<typeof transactionSchemas.create>;
export type UpdateTransactionInput = z.infer<typeof transactionSchemas.update>;
export type TransactionFilter = z.infer<typeof transactionSchemas.filter>;
export type CreateGoalInput = z.infer<typeof goalSchemas.create>;
export type UpdateGoalInput = z.infer<typeof goalSchemas.update>;
export type CreateInsightInput = z.infer<typeof insightSchemas.create>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
