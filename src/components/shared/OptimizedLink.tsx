import Link from 'next/link';
import React from 'react';

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  onClick?: () => void;
}

// Create an optimized link component that prefetches analytics page
export const OptimizedLink = ({ href, children, className, prefetch = true, onClick }: OptimizedLinkProps) => {
  return (
    <Link 
      href={href} 
      className={className}
      prefetch={prefetch}
      onClick={onClick}
      // Preload analytics page resources
      onMouseEnter={() => {
        if (href === '/analytics') {
          // Preload analytics-specific chunks
          import('../analytics/ComprehensiveAIAnalysis').catch(() => {});
          import('../analytics/TransactionAnalytics').catch(() => {});
        }
      }}
    >
      {children}
    </Link>
  );
};

export default OptimizedLink;
