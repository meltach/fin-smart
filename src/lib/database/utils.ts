import { prisma } from '@/lib/db';
import type { User, Account, Transaction, Goal, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Database utility functions for common operations
 */

// User operations
export const userOperations = {
  /**
   * Get user with related data
   */
  async getUserWithRelations(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        goals: {
          where: { isCompleted: false },
          orderBy: { priority: 'desc' }
        },
        insights: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
  },

  /**
   * Update user last login
   */
  async updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  },

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: { name?: string; avatar?: string; twoFactorEnabled?: boolean }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }
};

// Account operations
export const accountOperations = {
  /**
   * Get user accounts with recent transactions
   */
  async getUserAccountsWithTransactions(userId: string) {
    return prisma.account.findMany({
      where: { 
        userId,
        isActive: true 
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
   * Update account balance
   */
  async updateAccountBalance(accountId: string, balance: number, availableBalance?: number) {
    return prisma.account.update({
      where: { id: accountId },
      data: {
        balance,
        availableBalance,
        lastSyncAt: new Date()
      }
    });
  },

  /**
   * Get total balances by account type
   */
  async getTotalBalancesByType(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { 
        userId,
        isActive: true 
      },
      select: {
        type: true,
        balance: true
      }
    });

    return accounts.reduce((acc: Record<string, number>, account: { type: string; balance: number }) => {
      acc[account.type] = (acc[account.type] || 0) + account.balance;
      return acc;
    }, {} as Record<string, number>);
  },

  /**
   * Create a new account
   */
  async createAccount(data: {
    userId: string;
    type: string;
    provider: string;
    name: string;
    accountNumber?: string;
    routingNumber?: string;
    balance?: number;
    availableBalance?: number;
    currency?: string;
  }) {
    return prisma.account.create({
      data: {
        id: randomUUID(),
        userId: data.userId,
        type: data.type,
        provider: data.provider,
        name: data.name,
        accountNumber: data.accountNumber,
        routingNumber: data.routingNumber,
        balance: data.balance || 0,
        availableBalance: data.availableBalance,
        currency: data.currency || 'USD',
        isActive: true,
        updatedAt: new Date()
      }
    });
  },

  /**
   * Get account by ID (for specific user)
   */
  async getAccountById(accountId: string, userId: string) {
    return prisma.account.findFirst({
      where: { 
        id: accountId,
        userId,
        isActive: true 
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });
  },

  /**
   * Update account
   */
  async updateAccount(accountId: string, userId: string, data: {
    name?: string;
    balance?: number;
    availableBalance?: number;
    isActive?: boolean;
  }) {
    return prisma.account.updateMany({
      where: { 
        id: accountId,
        userId 
      },
      data: {
        ...data,
        updatedAt: new Date()
      }
    }).then(async (result: { count: number }) => {
      if (result.count === 0) return null;
      return prisma.account.findUnique({ where: { id: accountId } });
    });
  },

  /**
   * Deactivate account (soft delete)
   */
  async deactivateAccount(accountId: string, userId: string) {
    return prisma.account.updateMany({
      where: { 
        id: accountId,
        userId 
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    }).then(async (result: { count: number }) => {
      if (result.count === 0) return null;
      return prisma.account.findUnique({ where: { id: accountId } });
    });
  }
};

// Transaction operations
export const transactionOperations = {
  /**
   * Get transactions with pagination
   */
  async getTransactionsPaginated(
    userId: string, 
    page: number = 1, 
    limit: number = 50,
    filters?: {
      accountId?: string;
      category?: string[];
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const skip = (page - 1) * limit;
    
    const where = {
      userId,
      ...(filters?.accountId && { accountId: filters.accountId }),
      ...(filters?.category && { category: { hasSome: filters.category } }),
      ...(filters?.startDate && filters?.endDate && {
        date: {
          gte: filters.startDate,
          lte: filters.endDate
        }
      })
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: {
            select: {
              name: true,
              type: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Get spending by category for a date range
   */
  async getSpendingByCategory(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ) {
    return prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId,
        type: 'debit',
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      }
    });
  },

  /**
   * Get monthly cash flow
   */
  async getMonthlyCashFlow(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'credit',
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          amount: true
        }
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'debit',
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          amount: true
        }
      })
    ]);

    return {
      income: income._sum.amount || 0,
      expenses: Math.abs(expenses._sum.amount || 0),
      netCashFlow: (income._sum.amount || 0) + (expenses._sum.amount || 0)
    };
  },

  /**
   * Create a new transaction
   */
  async createTransaction(data: {
    userId: string;
    accountId: string;
    amount: number;
    description: string;
    name?: string;
    category: string[];
    subcategory?: string;
    personal_finance_category?: any;
    type: string;
    status?: string;
    merchant_name?: string;
    date?: Date;
    authorized_date?: string;
    authorized_datetime?: Date;
    iso_currency_code?: string;
    unofficial_currency_code?: string;
    check_number?: string;
    location?: any;
    payment_meta?: any;
    counterparties?: any[];
    logo_url?: string;
    website?: string;
    tags?: string[];
  }) {
    const createData = {
      id: randomUUID(),
      userId: data.userId,
      accountId: data.accountId,
      amount: data.amount,
      description: data.description,
      name: data.name,
      category: data.category, // Already an array from validation schema
      subcategory: data.subcategory,
      personalFinanceCategory: data.personal_finance_category,
      type: data.type,
      status: data.status || 'posted',
      merchantName: data.merchant_name,
      date: data.date || new Date(),
      authorizedDate: data.authorized_date,
      authorizedDatetime: data.authorized_datetime,
      isoCurrencyCode: data.iso_currency_code,
      unofficialCurrencyCode: data.unofficial_currency_code,
      checkNumber: data.check_number,
      location: data.location,
      paymentMeta: data.payment_meta,
      counterparties: data.counterparties || [],
      logoUrl: data.logo_url,
      website: data.website,
      tags: data.tags || [],
      updatedAt: new Date()
    };

    return prisma.transaction.create({
      data: createData,
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });
  },

  /**
   * Update transaction
   */
  async updateTransaction(transactionId: string, userId: string, data: {
    description?: string;
    name?: string;
    category?: string[];
    subcategory?: string;
    personal_finance_category?: any;
    merchant_name?: string;
    authorized_date?: string;
    authorized_datetime?: Date;
    iso_currency_code?: string;
    location?: any;
    payment_meta?: any;
    counterparties?: any[];
    logo_url?: string;
    website?: string;
    tags?: string[];
  }) {
    // Map snake_case (API/Plaid format) to camelCase (Prisma format)
    const fieldMapping: Record<string, string> = {
      'personal_finance_category': 'personalFinanceCategory',
      'merchant_name': 'merchantName',
      'authorized_date': 'authorizedDate',
      'authorized_datetime': 'authorizedDatetime',
      'iso_currency_code': 'isoCurrencyCode',
      'payment_meta': 'paymentMeta',
      'logo_url': 'logoUrl'
    };

    const prismaData: any = { updatedAt: new Date() };
    
    // Apply direct mappings for fields that don't need transformation
    const directFields = ['description', 'name', 'category', 'subcategory', 'location', 'counterparties', 'website', 'tags'];
    directFields.forEach(field => {
      if (data[field as keyof typeof data] !== undefined) {
        prismaData[field] = data[field as keyof typeof data];
      }
    });

    // Apply mapped fields (snake_case to camelCase)
    Object.entries(fieldMapping).forEach(([snakeCase, camelCase]) => {
      if (data[snakeCase as keyof typeof data] !== undefined) {
        prismaData[camelCase] = data[snakeCase as keyof typeof data];
      }
    });

    return prisma.transaction.updateMany({
      where: { 
        id: transactionId,
        userId 
      },
      data: prismaData
    }).then(async (result: { count: number }) => {
      if (result.count === 0) return null;
      return prisma.transaction.findUnique({ 
        where: { id: transactionId },
        include: {
          account: {
            select: {
              name: true,
              type: true
            }
          }
        }
      });
    });
  },

  /**
   * Delete transaction
   */
  async deleteTransaction(transactionId: string, userId: string) {
    return prisma.transaction.deleteMany({
      where: { 
        id: transactionId,
        userId 
      }
    });
  },

  /**
   * Get transaction by ID (for specific user)
   */
  async getTransactionById(transactionId: string, userId: string) {
    return prisma.transaction.findFirst({
      where: { 
        id: transactionId,
        userId 
      },
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });
  },

  /**
   * Get spending by merchant for analytics
   */
  async getSpendingByMerchant(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        amount: { lt: 0 }, // Only expenses (negative amounts)
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        merchantName: true,
        amount: true
      }
    });

    // Group by merchant and calculate totals
    const merchantTotals = transactions.reduce((acc: Record<string, { amount: number; count: number }>, tx) => {
      const merchant = tx.merchantName || 'Unknown Merchant';
      if (!acc[merchant]) {
        acc[merchant] = { amount: 0, count: 0 };
      }
      acc[merchant].amount += Math.abs(tx.amount);
      acc[merchant].count += 1;
      return acc;
    }, {});

    return Object.entries(merchantTotals).map(([merchant, data]) => ({
      merchant,
      amount: data.amount,
      count: data.count
    }));
  },

  /**
   * Get daily spending trend for analytics
   */
  async getDailySpendingTrend(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        amount: { lt: 0 }, // Only expenses (negative amounts)
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        date: true,
        amount: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Group by date and calculate daily totals
    const dailyTotals = transactions.reduce((acc: Record<string, number>, tx) => {
      const dateKey = tx.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      if (!acc[dateKey]) {
        acc[dateKey] = 0;
      }
      acc[dateKey] += Math.abs(tx.amount);
      return acc;
    }, {});

    return Object.entries(dailyTotals).map(([date, amount]) => ({
      date,
      amount
    }));
  }
};

// Goal operations
export const goalOperations = {
  /**
   * Get user goals with progress calculation
   */
  async getUserGoalsWithProgress(userId: string) {
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: [
        { isCompleted: 'asc' },
        { priority: 'desc' },
        { targetDate: 'asc' }
      ]
    });

    return goals.map((goal: any) => ({
      id: goal.id,
      name: goal.name,
      target: goal.targetAmount,
      current: goal.currentAmount,
      deadline: goal.targetDate.toISOString(),
      category: goal.category as 'emergency' | 'savings' | 'debt' | 'investment' | 'other',
      priority: goal.priority as 'high' | 'medium' | 'low',
      progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
      remainingAmount: goal.targetAmount - goal.currentAmount,
      daysRemaining: goal.targetDate ? Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
      isCompleted: goal.isCompleted || goal.currentAmount >= goal.targetAmount
    }));
  },

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId: string, amount: number) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId }
    });

    if (!goal) throw new Error('Goal not found');

    const newAmount = goal.currentAmount + amount;
    const isCompleted = newAmount >= goal.targetAmount;

    return prisma.goal.update({
      where: { id: goalId },
      data: {
        currentAmount: newAmount,
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    });
  },

  /**
   * Create a new goal
   */
  async createGoal(data: {
    userId: string;
    name: string;
    description?: string;
    target: number;
    current?: number;
    deadline?: Date;
    category?: string;
    priority?: string;
  }) {
    const goal = await prisma.goal.create({
      data: {
        id: randomUUID(),
        userId: data.userId,
        name: data.name,
        description: data.description,
        targetAmount: data.target,
        currentAmount: data.current || 0,
        targetDate: data.deadline || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        priority: data.priority || 'medium',
        category: data.category || 'general',
        isCompleted: false,
        updatedAt: new Date()
      }
    });

    // Return in the format expected by the frontend
    return {
      id: goal.id,
      name: goal.name,
      target: goal.targetAmount,
      current: goal.currentAmount,
      deadline: goal.targetDate.toISOString(),
      category: goal.category as 'emergency' | 'savings' | 'debt' | 'investment' | 'other',
      priority: goal.priority as 'high' | 'medium' | 'low'
    };
  },

  /**
   * Update goal
   */
  async updateGoal(goalId: string, userId: string, data: {
    name?: string;
    description?: string;
    target?: number;
    current?: number;
    deadline?: Date;
    category?: string;
    priority?: string;
  }) {
    // Map frontend field names to database field names
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.target !== undefined) updateData.targetAmount = data.target;
    if (data.current !== undefined) updateData.currentAmount = data.current;
    if (data.deadline !== undefined) updateData.targetDate = data.deadline;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.priority !== undefined) updateData.priority = data.priority;

    const result = await prisma.goal.updateMany({
      where: { 
        id: goalId,
        userId 
      },
      data: updateData
    });

    if (result.count === 0) return null;

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return null;

    // Return in the format expected by the frontend
    return {
      id: goal.id,
      name: goal.name,
      target: goal.targetAmount,
      current: goal.currentAmount,
      deadline: goal.targetDate.toISOString(),
      category: goal.category as 'emergency' | 'savings' | 'debt' | 'investment' | 'other',
      priority: goal.priority as 'high' | 'medium' | 'low'
    };
  },

  /**
   * Delete goal
   */
  async deleteGoal(goalId: string, userId: string) {
    return prisma.goal.deleteMany({
      where: { 
        id: goalId,
        userId 
      }
    });
  },

  /**
   * Get goal by ID
   */
  async getGoalById(goalId: string, userId: string) {
    return prisma.goal.findFirst({
      where: { 
        id: goalId,
        userId 
      }
    });
  }
};

// Insight operations
export const insightOperations = {
  /**
   * Create insight
   */
  async createInsight(
    userId: string,
    type: string,
    title: string,
    description: string,
    importance: 'low' | 'medium' | 'high' = 'medium',
    actionable: boolean = false,
    data?: any,
    validUntil?: Date
  ) {
    return prisma.insight.create({
      data: {
        id: randomUUID(),
        userId,
        type,
        title,
        description,
        importance,
        actionable,
        data,
        validUntil,
        updatedAt: new Date()
      }
    });
  },

  /**
   * Get user insights with pagination and filtering
   */
  async getUserInsights(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: string;
      importance?: string;
      isRead?: boolean;
      actionable?: boolean;
    }
  ) {
    const skip = (page - 1) * limit;
    
    const where = {
      userId,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.importance && { importance: filters.importance }),
      ...(filters?.isRead !== undefined && { isRead: filters.isRead }),
      ...(filters?.actionable !== undefined && { actionable: filters.actionable }),
      // Only show insights that haven't expired
      OR: [
        { validUntil: null },
        { validUntil: { gte: new Date() } }
      ]
    };

    const [insights, total] = await Promise.all([
      prisma.insight.findMany({
        where,
        orderBy: [
          { importance: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.insight.count({ where })
    ]);

    return {
      insights,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Get insight by ID
   */
  async getInsightById(insightId: string, userId: string) {
    return prisma.insight.findFirst({
      where: { 
        id: insightId,
        userId 
      }
    });
  },

  /**
   * Update insight
   */
  async updateInsight(insightId: string, userId: string, data: {
    title?: string;
    description?: string;
    importance?: 'low' | 'medium' | 'high';
    actionable?: boolean;
    isRead?: boolean;
    data?: any;
    validUntil?: Date;
  }) {
    return prisma.insight.updateMany({
      where: { 
        id: insightId,
        userId 
      },
      data: {
        ...data,
        updatedAt: new Date()
      }
    }).then(async (result: any) => {
      if (result.count === 0) return null;
      return prisma.insight.findUnique({ where: { id: insightId } });
    });
  },

  /**
   * Delete insight
   */
  async deleteInsight(insightId: string, userId: string) {
    return prisma.insight.deleteMany({
      where: { 
        id: insightId,
        userId 
      }
    });
  },

  /**
   * Mark single insight as read
   */
  async markInsightAsRead(insightId: string, userId: string) {
    return prisma.insight.updateMany({
      where: {
        id: insightId,
        userId
      },
      data: {
        isRead: true
      }
    });
  },

  /**
   * Mark insights as read
   */
  async markInsightsAsRead(userId: string, insightIds: string[]) {
    return prisma.insight.updateMany({
      where: {
        userId,
        id: { in: insightIds }
      },
      data: {
        isRead: true
      }
    });
  },

  /**
   * Get insights by type
   */
  async getInsightsByType(userId: string, type: string) {
    return prisma.insight.findMany({
      where: {
        userId,
        type,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      },
      orderBy: [
        { importance: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  },

  /**
   * Get unread insights count
   */
  async getUnreadInsightsCount(userId: string) {
    return prisma.insight.count({
      where: {
        userId,
        isRead: false,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      }
    });
  },

  /**
   * Get recent insights
   */
  async getRecentInsights(userId: string, limit: number = 5) {
    return prisma.insight.findMany({
      where: {
        userId,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit
    });
  }
};

/**
 * Enhanced date range utilities for financial data analysis
 */
export const dateRangeUtils = {
  /**
   * Get predefined date ranges for common financial periods
   */
  getPresetRanges(): Record<string, { startDate: Date; endDate: Date }> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Set end of day for current date ranges using UTC
    const endOfToday = new Date(now);
    endOfToday.setUTCHours(23, 59, 59, 999);
    
    return {
      'last7days': {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: endOfToday
      },
      'last30days': {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: endOfToday
      },
      'last3months': {
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate: endOfToday
      },
      'last90days': {
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate: endOfToday
      },
      'thisMonth': {
        startDate: new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0)),
        endDate: new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999))
      },
      'lastMonth': {
        startDate: new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0)),
        endDate: new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999))
      },
      'thisQuarter': {
        startDate: new Date(Date.UTC(currentYear, Math.floor(currentMonth / 3) * 3, 1, 0, 0, 0, 0)),
        endDate: new Date(Date.UTC(currentYear, Math.floor(currentMonth / 3) * 3 + 3, 0, 23, 59, 59, 999))
      },
      'thisYear': {
        startDate: new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0)),
        endDate: new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999))
      },
      'lastYear': {
        startDate: new Date(Date.UTC(currentYear - 1, 0, 1, 0, 0, 0, 0)),
        endDate: new Date(Date.UTC(currentYear - 1, 11, 31, 23, 59, 59, 999))
      }
    };
  },

  /**
   * Get transactions with enhanced date filtering and comparison
   */
  async getTransactionsWithDateComparison(
    userId: string,
    currentRange: { startDate: Date; endDate: Date },
    previousRange?: { startDate: Date; endDate: Date }
  ) {
    const currentTransactions = await transactionOperations.getTransactionsPaginated(
      userId, 1, 1000, { 
        startDate: currentRange.startDate, 
        endDate: currentRange.endDate 
      }
    );

    let comparison = null;
    if (previousRange) {
      const previousTransactions = await transactionOperations.getTransactionsPaginated(
        userId, 1, 1000, { 
          startDate: previousRange.startDate, 
          endDate: previousRange.endDate 
        }
      );
      
      const currentTotal = currentTransactions.transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      const previousTotal = previousTransactions.transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      
      comparison = {
        previousTotal,
        currentTotal,
        change: currentTotal - previousTotal,
        percentChange: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0
      };
    }

    return {
      ...currentTransactions,
      comparison
    };
  },

  /**
   * Get spending trends by category over multiple periods
   */
  async getSpendingTrendsByCategory(
    userId: string,
    periods: { startDate: Date; endDate: Date; label: string }[]
  ) {
    const trendData = await Promise.all(
      periods.map(async (period) => {
        const spending = await transactionOperations.getSpendingByCategory(userId, period.startDate, period.endDate);
        return {
          period: period.label,
          startDate: period.startDate,
          endDate: period.endDate,
          spending
        };
      })
    );

    return trendData;
  }
};

// Health check and maintenance
export const maintenanceOperations = {
  /**
   * Check database connection
   */
  async healthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date() 
      };
    }
  },

  /**
   * Clean up expired sessions and refresh tokens
   */
  async cleanupExpiredTokens() {
    const now = new Date();
    
    const [sessions, refreshTokens] = await Promise.all([
      prisma.session.deleteMany({
        where: {
          expires: {
            lt: now
          }
        }
      }),
      prisma.refreshToken.deleteMany({
        where: {
          expires: {
            lt: now
          }
        }
      })
    ]);

    return {
      deletedSessions: sessions.count,
      deletedRefreshTokens: refreshTokens.count
    };
  },

  /**
   * Clean up old audit logs (older than 90 days)
   */
  async cleanupOldAuditLogs() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo
        }
      }
    });

    return { deletedLogs: result.count };
  }
};
