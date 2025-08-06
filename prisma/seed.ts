import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create a test user
  const hashedPassword = await hashPassword('testpassword123');
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('Created test user:', testUser.email);

  // Create some sample financial data
  const account = await prisma.account.create({
    data: {
      id: randomUUID(),
      userId: testUser.id,
      type: 'depository',
      provider: 'manual',
      name: 'Main Checking',
      balance: 5000.00,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('Created test account:', account.name);

  // Create sample transactions
  const transactions = await prisma.transaction.createMany({
    data: [
      {
        id: randomUUID(),
        userId: testUser.id,
        accountId: account.id,
        amount: -45.67,
        description: 'Grocery Store',
        category: ['Food and Drink', 'Groceries'],
        type: 'place',
        date: new Date('2025-06-25'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: testUser.id,
        accountId: account.id,
        amount: -12.50,
        description: 'Coffee Shop',
        category: ['Food and Drink', 'Coffee Shops'],
        type: 'place',
        date: new Date('2025-06-26'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: testUser.id,
        accountId: account.id,
        amount: 2500.00,
        description: 'Salary Deposit',
        category: ['Deposit', 'Payroll'],
        type: 'special',
        date: new Date('2025-06-27'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  console.log(`Created ${transactions.count} sample transactions`);

  // Create a sample goal
  const goal = await prisma.goal.create({
    data: {
      id: randomUUID(),
      userId: testUser.id,
      name: 'Emergency Fund',
      description: 'Build emergency fund for 6 months of expenses',
      targetAmount: 15000.00,
      currentAmount: 2500.00,
      targetDate: new Date('2025-12-31'),
      category: 'emergency_fund',
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('Created test goal:', goal.name);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
