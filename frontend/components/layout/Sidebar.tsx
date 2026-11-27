'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLunovaStore } from '@/lib/lunovaStore';
import { useAuth } from '@/hooks/useAuth';
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
  BarChart3,
  LogOut,
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
  const router = useRouter();
  const { proposals } = useLunovaStore();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Observatory', href: '/dashboard', icon: Compass },
    {
      label: 'Proposals',
      href: '/proposals',
      icon: FileText,
      badge: proposals.length > 0 ? proposals.length.toString() : '3',
    },
    { label: 'Review Interface', href: '/review', icon: CheckCircle2 },
    { label: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
    { label: 'Integrations', href: '/integrations', icon: Plug },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleSignOut = () => {
    logout();
    router.replace('/login');
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
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-xs ${
          isCollapsed ? 'w-[68px]' : 'w-60'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Header / Brand */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 overflow-hidden group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center font-display font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
                <span className="text-emerald-400">L</span>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="font-display font-extrabold text-base tracking-tight text-slate-950 block leading-none">
                    LUNOVA
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                    Observatory
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
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
          <nav className="p-3 space-y-1 font-sans">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 border border-transparent'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? 'text-emerald-600' : 'text-slate-500'}`} />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail Section: Tenant, User & Sign Out */}
        <div className="p-3 border-t border-slate-200/90 space-y-2">
          {/* Tenant indicator */}
          <div
            className={`p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Multi-Tenant Isolation Enforced"
          >
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {!isCollapsed && (
              <div className="min-w-0 flex-1 truncate">
                <p className="text-xs font-bold text-slate-900 truncate font-display">
                  Lunetron Core
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-mono font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Air-Gapped Enclave</span>
                </div>
              </div>
            )}
          </div>

          {/* User profile capsule with functional Sign Out */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 truncate">
              <div className="w-8 h-8 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs font-display">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SJ'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 truncate">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight font-display">
                    {user?.name || 'Sarah Jenkins'}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-700 truncate font-semibold">
                    {user?.role || 'ADMIN'}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Sign out of enterprise workspace"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
