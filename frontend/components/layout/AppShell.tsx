'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLunovaStore } from '@/lib/lunovaStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { CommandPalette } from '@/components/ui/CommandPalette';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const { settings, setTheme } = useLunovaStore();
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize theme attribute on html root
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings.theme]);

  // Public landing page and login page render without the authenticated app shell
  const isPublicPage = pathname === '/' || pathname === '/login';

  if (isPublicPage) {
    return (
      <main className="min-h-screen">
        {children}
        <ToastContainer />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text flex">
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
