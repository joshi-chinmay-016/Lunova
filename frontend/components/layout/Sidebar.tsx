'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BookOpen,
  BarChart3,
  Settings,
  Sparkles,
  Compass,
  Building2,
  Users2,
  ChevronDown,
  X,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  comingSoon?: boolean;
}

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Proposals', href: '/proposals', icon: FileSpreadsheet },
  { label: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
];

const INSIGHTS_NAV: NavItem[] = [
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

const FUTURE_NAV: NavItem[] = [
  { label: 'RFP Discovery', href: '#', icon: Compass, comingSoon: true },
  { label: 'Customers', href: '#', icon: Building2, comingSoon: true },
  { label: 'Collaboration', href: '#', icon: Users2, comingSoon: true },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const isCurrent = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1 mb-6">
      <div className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </div>
      {items.map((item) => {
        const active = isCurrent(item.href);
        const Icon = item.icon;

        if (item.comingSoon) {
          return (
            <div
              key={item.label}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-400 cursor-not-allowed select-none opacity-60 hover:bg-transparent"
              title="Capability in roadmap"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-gray-400" />
                <span>{item.label}</span>
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
                Soon
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
              active
                ? 'bg-blue-50/80 text-blue-700 font-semibold border border-blue-200/50 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                )}
              />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E2E5E9] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#E2E5E9] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-clay-button border border-blue-600">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-gray-900">Lunova</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Proposal Intelligence</p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Switcher Preview (Multi-Tenant Ready) */}
        <div className="p-3 border-b border-[#E2E5E9]">
          <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E5E9] flex items-center justify-between hover:bg-gray-100/60 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-600/20 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                L
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-gray-800 truncate">Lunetron Technologies</p>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-[10px] text-gray-500">Enterprise Workspace</span>
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {renderNavGroup('Main', MAIN_NAV)}
          {renderNavGroup('Insights', INSIGHTS_NAV)}
          {renderNavGroup('Administration', ADMIN_NAV)}
          {renderNavGroup('Platform Roadmap', FUTURE_NAV)}
        </div>

        {/* Bottom User Bar */}
        <div className="p-3 border-t border-[#E2E5E9] bg-gray-50/60">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-xs flex items-center justify-center">
              SJ
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">Sarah Jenkins</p>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] text-gray-500 truncate">Lead Reviewer</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
