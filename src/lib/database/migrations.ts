import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

/**
 * Database migration management utilities
 */

export class MigrationManager {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Check if database is up to date with migrations
   */
  async isDatabaseUpToDate(): Promise<boolean> {
    try {
      const result = execSync('npx prisma migrate status', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      return result.includes('Database is up to date');
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      execSync('npx prisma migrate deploy', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Error running migrations:', error);
      throw error;
    }
  }

  /**
   * Generate Prisma client
   */
  async generateClient(): Promise<void> {
    try {
      execSync('npx prisma generate', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.error('❌ Error generating Prisma client:', error);
      throw error;
    }
  }

  /**
   * Create a new migration
   */
  async createMigration(name: string): Promise<void> {
    try {
      execSync(`npx prisma migrate dev --name ${name}`, {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
      console.log(`✅ Migration '${name}' created successfully`);
    } catch (error) {
      console.error(`❌ Error creating migration '${name}':`, error);
      throw error;
    }
  }

  /**
   * Reset database (WARNING: This will delete all data)
   */
  async resetDatabase(): Promise<void> {
    try {
      execSync('npx prisma migrate reset --force', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Error resetting database:', error);
      throw error;
    }
  }

  /**
   * Seed the database
   */
  async seedDatabase(): Promise<void> {
    try {
      execSync('npm run db:seed', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
      console.log('✅ Database seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  /**
   * Get migration history
   */
  async getMigrationHistory(): Promise<string[]> {
    const migrationsDir = path.join(this.projectRoot, 'prisma', 'migrations');
    
    if (!existsSync(migrationsDir)) {
      return [];
    }

    try {
      const result = execSync('npx prisma migrate status', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Parse migration status output to extract migration names
      const lines = result.split('\n');
      const migrations: string[] = [];
      
      for (const line of lines) {
        if (line.includes('Applied') || line.includes('Pending')) {
          const match = line.match(/\d{14}_\w+/);
          if (match) {
            migrations.push(match[0]);
          }
        }
      }
      
      return migrations;
    } catch (error) {
      console.error('Error getting migration history:', error);
      return [];
    }
  }

  /**
   * Validate schema file
   */
  async validateSchema(): Promise<boolean> {
    try {
      execSync('npx prisma validate', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      return true;
    } catch (error) {
      console.error('Schema validation failed:', error);
      return false;
    }
  }

  /**
   * Push schema changes to database (for development)
   */
  async pushSchema(): Promise<void> {
    try {
      execSync('npx prisma db push', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
      console.log('✅ Schema pushed to database successfully');
    } catch (error) {
      console.error('❌ Error pushing schema:', error);
      throw error;
    }
  }

  /**
   * Setup database for development
   */
  async setupDevelopment(): Promise<void> {
    console.log('🚀 Setting up development database...');
    
    try {
      // Validate schema
      const isValid = await this.validateSchema();
      if (!isValid) {
        throw new Error('Schema validation failed');
      }

      // Generate client
      await this.generateClient();

      // Check if migrations are needed
      const isUpToDate = await this.isDatabaseUpToDate();
      if (!isUpToDate) {
        console.log('📦 Running pending migrations...');
        await this.runMigrations();
      }

      // Seed database if needed
      console.log('🌱 Seeding database...');
      await this.seedDatabase();

      console.log('✅ Development database setup completed successfully!');
    } catch (error) {
      console.error('❌ Failed to setup development database:', error);
      throw error;
    }
  }

  /**
   * Setup database for production
   */
  async setupProduction(): Promise<void> {
    console.log('🚀 Setting up production database...');
    
    try {
      // Validate schema
      const isValid = await this.validateSchema();
      if (!isValid) {
        throw new Error('Schema validation failed');
      }

      // Generate client
      await this.generateClient();

      // Run migrations
      console.log('📦 Running migrations...');
      await this.runMigrations();

      console.log('✅ Production database setup completed successfully!');
    } catch (error) {
      console.error('❌ Failed to setup production database:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const migrationManager = new MigrationManager();
