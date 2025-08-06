"use client";

import React from 'react';
import { Header } from '@/components/Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="md:ml-16 p-6">
        {children}
      </main>
    </div>
  );
}
