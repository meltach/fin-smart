import { AppLayout } from '@/components/AppLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { DataInitializer } from '@/components/DataInitializer';
import { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

// This layout applies to all routes in the (dashboard) group
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppLayout>
        <Suspense fallback={<LoadingSkeleton />}>
          <DataInitializer />
          {children}
        </Suspense>
      </AppLayout>
    </AuthGuard>
  );
}
