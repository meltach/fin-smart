/**
 * Database utilities and operations
 * Centralized exports for all database-related functionality
 */

// Core database client
export { prisma, disconnectDB } from '../db';

// Database operations
export {
  userOperations,
  accountOperations,
  transactionOperations,
  goalOperations,
  insightOperations,
  maintenanceOperations,
  dateRangeUtils,
} from './utils';

// Validation schemas
export {
  dbSchemas,
  userSchemas,
  accountSchemas,
  transactionSchemas,
  goalSchemas,
  insightSchemas,
  paginationSchema,
  dateRangeSchema,
  idSchema,
} from './schemas';

// Type exports
export type {
  CreateUserInput,
  UpdateUserInput,
  CreateAccountInput,
  UpdateAccountInput,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilter,
  CreateGoalInput,
  UpdateGoalInput,
  CreateInsightInput,
  PaginationInput,
  DateRangeInput,
} from './schemas';

// Migration management
export { MigrationManager, migrationManager } from './migrations';

// Re-export Prisma types for convenience
export type {
  User,
  Account,
  Transaction,
  Goal,
  Insight,
  Session,
  RefreshToken,
  PlaidItem,
  AuditLog,
} from '@prisma/client';
