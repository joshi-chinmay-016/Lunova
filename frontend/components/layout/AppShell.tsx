'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLunovaStore } from '@/lib/lunovaStore';
import { useAuth } from '@/hooks/useAuth';
import { getAuthToken } from '@/services/api';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Sparkles, ShieldCheck } from 'lucide-react';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'day');
    }
  }, []);

  // Public routes: landing page and login page
  const isPublicPage = pathname === '/' || pathname === '/login';

  // Route Protection & Redirect: if not on public route and definitely not authenticated
  useEffect(() => {
    const hasToken = typeof window !== 'undefined' ? (!!getAuthToken() || isAuthenticated) : isAuthenticated;
    if (mounted && !isLoading && !isAuthenticated && !hasToken && !isPublicPage) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, isLoading, isAuthenticated, isPublicPage, pathname, router]);

  if (isPublicPage) {
    return (
      <main className="min-h-screen">
        {children}
        <ToastContainer />
      </main>
    );
  }

  // Loading state while verifying enterprise JWT session
  if (!mounted || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-display font-bold text-lg shadow-md animate-pulse">
            <span className="text-emerald-400">L</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-900 text-sm">
              Verifying Enterprise JWT Credentials...
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Redirecting to secure login station if unauthenticated
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Collapsible Left Rail */}
      <Sidebar
        isCollapsed={isRailCollapsed}
        onToggleCollapse={() => setIsRailCollapsed(!isRailCollapsed)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Observatory Content Viewport */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isRailCollapsed ? 'lg:pl-[68px]' : 'lg:pl-60'
        }`}
      >
        <Header onOpenMobileMenu={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>

      {/* Global Overlays */}
      <ToastContainer />
      <CommandPalette />
    </div>
  );
};
