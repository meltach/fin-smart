FinSmart

FinSmart is a modern, authentication-ready financial dashboard built with Next.js App Router. It features scalable architecture, centralized authentication, and clean separation of public and protected routes.

## Features
- **Next.js App Router**: Uses route groups and layouts for scalable structure
- **Centralized Authentication**: AuthProvider, AuthGuard, and server-side middleware
- **Consistent Layouts**: AppLayout automatically wraps all protected dashboard pages
- **Easy Page Creation**: Add new protected or public pages with minimal setup
- **Performance**: Shared layouts, code splitting, SSR compatibility

## Project Structure
```
src/app/
├── layout.tsx                  # Root layout (global providers)
├── login/                      # Public login page
├── (dashboard)/                # Protected dashboard routes
│   ├── layout.tsx              # Dashboard layout (AppLayout + AuthGuard)
│   ├── page.tsx                # Dashboard homepage
│   ├── goals/                  # Goals page
│   ├── analytics/              # Analytics page
│   └── settings/               # Settings page
└── middleware.ts               # Server-side authentication middleware
```

## Authentication
- **AuthProvider**: Manages user state, login/logout, token storage
- **AuthGuard**: Protects dashboard routes, handles loading and redirects
- **Middleware**: Server-side route protection and automatic redirects

## How to Add Pages
- **Protected page**: Add to `src/app/(dashboard)/your-page/page.tsx`
- **Public page**: Add to `src/app/public-page/page.tsx`

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. Access the app at `http://localhost:3000`

## Tech Stack & Integrations
- **Plaid API**: Aggregates financial data from user accounts. You need a Plaid developer account and API keys. See `src/services/plaidService.ts` for integration details.
- **Prisma ORM**: Database access and migrations. Schema is defined in `prisma/schema.prisma`. Use Prisma CLI for migrations and generating the client.
- **PostgreSQL via Docker**: Local development uses Docker to initialize databases and extensions. See `docker/postgres/init/01-init.sh` for setup logic.
- **React Query**: Efficient data fetching, caching, and synchronization. See `src/components/providers/QueryProvider.tsx` and hooks in `src/hooks/`.
- **Zustand**: State management for global and local app state. See `src/stores/` for store implementations.
- **shadcn/ui**: Modern, accessible React UI components. See `src/components/ui/` for usage examples.

## Local Development with Docker
1. Ensure you have Docker installed.
2. Start the database with:
   ```bash
   docker-compose up -d
   ```
3. The initialization script creates required databases and extensions automatically.
4. Update your `.env` file with the correct `DATABASE_URL` for Prisma and Plaid API keys.

## Prisma Usage
Run migrations and generate the client:
```bash
npx prisma migrate dev
npx prisma generate
```

## Plaid Setup
1. Sign up for a Plaid developer account.
2. Add your Plaid API keys to the `.env` file:
   ```env
   PLAID_CLIENT_ID=your_client_id
   PLAID_SECRET=your_secret
   PLAID_ENV=sandbox
   ```
3. See `src/services/plaidService.ts` for usage.

## License
MIT
