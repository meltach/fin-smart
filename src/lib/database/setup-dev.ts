#!/usr/bin/env tsx

/**
 * Development database setup script
 * Run this script to set up your local development database
 */

import { migrationManager } from './migrations';

async function setupDevelopment() {
  console.log('🏗️  Setting up development database...\n');

  try {
    await migrationManager.setupDevelopment();
    console.log('\n🎉 Development environment is ready!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Open Prisma Studio: npm run db:studio');
    console.log('   3. Check your database at http://localhost:5555');
  } catch (error) {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDevelopment();
}
