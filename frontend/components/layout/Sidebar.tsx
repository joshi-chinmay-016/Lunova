'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLunovaStore } from '@/lib/lunovaStore';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import {
  Compass,
  FileText,
  BookOpen,
  CheckCircle2,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}) => {
  const pathname = usePathname();
  const { user, proposals } = useLunovaStore();

  const navItems = [
    { label: 'Observatory', href: '/dashboard', icon: Compass },
    {
      label: 'Proposals',
      href: '/proposals',
      icon: FileText,
      badge: proposals.length.toString(),
    },
    { label: 'Review Interface', href: '/review', icon: CheckCircle2 },
    { label: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
    { label: 'Integrations', href: '/integrations', icon: Plug },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Rail Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-surface-1 border-r border-line flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isCollapsed ? 'w-[68px]' : 'w-60'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Header / Brand */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-line">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 overflow-hidden group"
            >
              <div className="w-9 h-9 rounded-md bg-surface-2 border border-line flex items-center justify-center shrink-0 group-hover:border-accent transition-colors">
                <PhaseGlyph phase="in_review" size="sm" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="font-bold text-base tracking-tight text-text block leading-none">
                    LUNOVA
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-semibold">
                    Observatory
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text transition-colors"
              title={isCollapsed ? 'Expand rail' : 'Collapse rail'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all duration-150 ${
                    active
                      ? 'bg-surface-2 text-accent border border-line font-semibold shadow-xs'
                      : 'text-text-muted hover:text-text hover:bg-surface-2/60 border border-transparent'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface-3 text-text-muted font-bold border border-line">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail Section: Tenant & User */}
        <div className="p-3 border-t border-line space-y-2">
          {/* Tenant indicator */}
          <div
            className={`p-2 rounded bg-surface-2/50 border border-line flex items-center gap-2 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Multi-Tenant Isolation Enforced"
          >
            <Building2 className="w-3.5 h-3.5 text-accent shrink-0" />
            {!isCollapsed && (
              <div className="min-w-0 flex-1 truncate">
                <p className="text-[11px] font-semibold text-text truncate">
                  {user.tenant}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-evidence font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Air-Gapped RAG</span>
                </div>
              </div>
            )}
          </div>

          {/* User profile capsule */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded hover:bg-surface-2 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-accent text-bg flex items-center justify-center font-bold text-xs shrink-0">
              {user.avatarInitials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 truncate">
                <p className="text-xs font-medium text-text truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] font-mono text-text-muted truncate">
                  {user.role}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
