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
    toggleCommandPalette,
    user,
    proposals,
    addToast,
  } = useLunovaStore();

  const pendingCount = proposals.filter((p: { phase: string }) => p.phase === 'in_review').length;

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-line bg-surface-1 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Global Search ⌘K Trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text border border-line transition-colors cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        {/* ⌘K Command Palette Search Bar Trigger */}
        <button
          onClick={toggleCommandPalette}
          className="w-full flex items-center justify-between min-h-[42px] px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-line text-sm text-text-muted hover:text-text transition-all duration-150 group text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
            <span className="truncate font-medium">Search proposals, docs, evidence...</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] font-semibold bg-surface-1 px-2 py-0.5 rounded-md border border-line text-text-muted shadow-xs">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right: Tenant, Notifications */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Tenant Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-2 border border-line text-xs font-mono font-semibold text-text">
          <Building2 className="w-3.5 h-3.5 text-accent" />
          <span>{user.tenant}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() =>
            addToast({
              title: 'Review Queue Synchronized',
              message: `${pendingCount} proposals currently require human inspection.`,
              type: 'default',
            })
          }
          className="relative min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl hover:bg-surface-2 text-text-muted hover:text-text border border-line transition-colors cursor-pointer"
          title={`${pendingCount} proposals in review`}
        >
          <Bell className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
          )}
        </button>
      </div>
    </header>
  );
};
