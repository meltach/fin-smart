# Database Setup - FinSmart

This document provides comprehensive instructions for setting up and managing the PostgreSQL database for FinSmart using Prisma ORM.

## 🏗️ Architecture Overview

- **Database**: PostgreSQL 15
- **ORM**: Prisma Client with TypeScript
- **Connection Pooling**: PgBouncer (production)
- **Migrations**: Prisma Migrate
- **Seeding**: Custom seed scripts

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment template and configure your database:

```bash
cp .env.example .env.local
```

Update `.env.local` with your database credentials:

```env
DATABASE_URL="postgresql://postgres:password123@localhost:5432/fin_smart_dev"
DIRECT_URL="postgresql://postgres:password123@localhost:5432/fin_smart_dev"
```

### 2. Start PostgreSQL (Docker)

```bash
# Start PostgreSQL with Docker Compose
docker-compose up postgres -d

# Check if PostgreSQL is running
docker-compose ps
```

### 3. Setup Development Database

```bash
# Run the automated setup script
npm run db:setup:dev
```

This script will:
- Validate the Prisma schema
- Generate the Prisma client
- Run pending migrations
- Seed the database with sample data

### 4. Verify Setup

```bash
# Check migration status
npm run db:status

# Open Prisma Studio to browse data
npm run db:studio
```

## 📋 Database Schema

### Core Models

1. **User** - User authentication and profile
2. **Account** - Connected bank accounts
3. **Transaction** - Financial transactions
4. **Goal** - Financial goals and targets
5. **Insight** - AI-generated insights
6. **Session** - User session management
7. **PlaidItem** - Plaid integration data
8. **AuditLog** - Security and audit trail

### Key Features

- **Type Safety**: Full TypeScript support with Prisma Client
- **Optimized Indexes**: Performance-optimized database indexes
- **Cascade Deletes**: Proper foreign key relationships
- **Audit Trail**: Comprehensive logging for security
- **Connection Pooling**: Production-ready connection management

## 🛠️ Available Commands

### Database Operations

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes (development only)
npm run db:push

# Create and run migrations
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Check migration status
npm run db:status

# Validate schema
npm run db:validate

# Reset database (⚠️ destructive)
npm run db:reset

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Setup Scripts

```bash
# Setup development environment
npm run db:setup:dev

# Setup production environment
npm run db:setup:prod
```

## 🏭 Production Deployment

### Connection Pooling

For production, use connection pooling with PgBouncer or Prisma Accelerate:

```env
# With PgBouncer
DATABASE_URL="postgresql://user:pass@pgbouncer-host:6432/fin_smart_prod?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@postgres-host:5432/fin_smart_prod"

# With Prisma Accelerate
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=your_api_key"
DIRECT_URL="postgresql://user:pass@postgres-host:5432/fin_smart_prod"
```

### Migration Strategy

1. **Staging**: Test migrations in staging environment
2. **Backup**: Always backup production database before migrations
3. **Deploy**: Use `npm run db:migrate:deploy` for production
4. **Verify**: Check application functionality after deployment

### Monitoring

- Monitor connection pool usage
- Track slow queries (>1000ms logged by default)
- Set up alerts for failed connections
- Regular database maintenance and VACUUM

## 📊 Database Utilities

### Type-Safe Operations

```typescript
import { userOperations, accountOperations } from '@/lib/database';

// Get user with related data
const user = await userOperations.getUserWithRelations(userId);

// Get user accounts with transactions
const accounts = await accountOperations.getUserAccountsWithTransactions(userId);
```

### Validation Schemas

```typescript
import { dbSchemas } from '@/lib/database';

// Validate user input
const validatedData = dbSchemas.user.create.parse(userData);

// Validate transaction filters
const filters = dbSchemas.transaction.filter.parse(queryParams);
```

### Migration Management

```typescript
import { migrationManager } from '@/lib/database';

// Check if database is up to date
const isUpToDate = await migrationManager.isDatabaseUpToDate();

// Run pending migrations
await migrationManager.runMigrations();
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection refused**: Ensure PostgreSQL is running
2. **Migration conflicts**: Reset development database if needed
3. **Schema validation errors**: Check Prisma schema syntax
4. **Permission denied**: Verify database user permissions

### Debug Commands

```bash
# Check PostgreSQL status
docker-compose logs postgres

# Test database connection
npx prisma db pull

# Reset development environment
npm run db:reset
npm run db:setup:dev
```

### Performance Optimization

- Use appropriate indexes for query patterns
- Monitor and optimize slow queries
- Configure connection pooling for your load
- Regular database maintenance (VACUUM, ANALYZE)

## 🧪 Testing

### Test Database

Use a separate database for testing:

```env
# .env.test.local
DATABASE_URL="postgresql://postgres:password123@localhost:5432/fin_smart_test"
```

### Test Utilities

```typescript
import { prisma } from '@/lib/database';

// Clean up after tests
await prisma.$transaction([
  prisma.transaction.deleteMany(),
  prisma.account.deleteMany(),
  prisma.users.deleteMany(),
]);
```

## 📈 Monitoring and Maintenance

### Regular Tasks

1. **Monitor connection pool**: Check for connection leaks
2. **Analyze slow queries**: Optimize based on logs
3. **Update statistics**: Run ANALYZE periodically
4. **Backup verification**: Test backup restoration
5. **Security audit**: Review audit logs regularly

### Metrics to Track

- Connection pool utilization
- Query execution times
- Database size growth
- Failed connection attempts
- Migration success rate

## 🔐 Security Considerations

- Use connection pooling to prevent connection exhaustion
- Encrypt sensitive data in database columns
- Regular security updates for PostgreSQL
- Audit trail for all data modifications
- Environment-specific database credentials
- SSL/TLS for database connections in production

## 📞 Support

For database-related issues:

1. Check the troubleshooting section above
2. Review PostgreSQL and Prisma logs
3. Consult Prisma documentation
4. Check application-specific error logs

Remember to always backup your database before making significant changes!
