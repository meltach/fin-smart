#!/usr/bin/env tsx

/**
 * Production database setup script
 * Run this script to set up your production database
 */

import { migrationManager } from './migrations';

async function setupProduction() {
  console.log('🚀 Setting up production database...\n');

  // Verify environment
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Warning: NODE_ENV is not set to "production"');
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    await migrationManager.setupProduction();
    console.log('\n🎉 Production database setup completed!');
    console.log('\n📋 Database is ready for production use');
  } catch (error) {
    console.error('\n💥 Production setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupProduction();
}
