'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { token, isLoading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Public pages that do not require authentication or dashboard shell
  const isPublicPage = pathname === '/' || pathname === '/login';

  useEffect(() => {
    if (mounted && !token && !isLoading && !isPublicPage) {
      router.push('/login');
    }
  }, [mounted, token, isLoading, isPublicPage, router]);

  // If on landing page or login page, render children directly without dashboard shell
  if (isPublicPage) {
    return <main className="min-h-screen bg-transparent">{children}</main>;
  }

  // Before client hydration or if not authenticated on protected routes, show loading placeholder
  if (!mounted || !token) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Authenticating workspace session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Persistent Left Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {children}
        </main>
      </div>
    </div>
  );
};
