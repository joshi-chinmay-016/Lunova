'use client';

import React from 'react';
import { useLunovaStore } from '@/lib/lunovaStore';
import {
  Search,
  Sun,
  Moon,
  Menu,
  Bell,
  Command,
  Sparkles,
  Building2,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    settings,
    toggleTheme,
    toggleCommandPalette,
    user,
    proposals,
    addToast,
  } = useLunovaStore();

  const handleThemeToggle = () => {
    toggleTheme();
    const nextTheme = settings.theme === 'night' ? 'Day Side' : 'Night Side';
    addToast({
      title: `Theme: ${nextTheme}`,
      message: `Observatory canvas transitioned to ${nextTheme}.`,
      type: 'default',
    });
  };

  const pendingCount = proposals.filter((p: { phase: string }) => p.phase === 'in_review').length;

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-line bg-surface-1 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile Toggle & Global Search ⌘K Trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-md hover:bg-surface-2 text-text-muted hover:text-text border border-line"
          aria-label="Open Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* ⌘K Command Palette Search Bar Trigger */}
        <button
          onClick={toggleCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs text-text-muted hover:text-text transition-all duration-150 group text-left"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
            <span className="truncate">Search proposals, docs, evidence...</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] bg-surface-1 px-1.5 py-0.5 rounded border border-line">
            <Command className="w-3 h-3 text-text-muted" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right: Tenant, Notifications, Theme Toggle */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Tenant Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-line text-xs font-mono">
          <Building2 className="w-3 h-3 text-accent" />
          <span className="text-text font-medium">{user.tenant}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() =>
            addToast({
              title: 'Review Queue Updated',
              message: `${pendingCount} proposals currently awaiting human sign-off.`,
              type: 'default',
            })
          }
          className="relative p-2 rounded-md hover:bg-surface-2 text-text-muted hover:text-text border border-transparent hover:border-line transition-colors"
          title={`${pendingCount} proposals in review`}
        >
          <Bell className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
          )}
        </button>

        {/* Night / Day Side Animated Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-text transition-colors"
          title={`Switch to ${settings.theme === 'night' ? 'Day Side (Light)' : 'Night Side (Dark)'}`}
        >
          {settings.theme === 'night' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline text-text-muted text-[11px] font-mono">Night Side</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline text-text-muted text-[11px] font-mono">Day Side</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
