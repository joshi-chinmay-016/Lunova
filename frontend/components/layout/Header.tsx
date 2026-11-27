'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Command,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NewProposalModal } from '@/components/proposals/NewProposalModal';
import { useAuth } from '@/hooks/useAuth';
import { useLunovaStore } from '@/lib/lunovaStore';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth();
  const { toggleCommandPalette, user: storeUser, proposals, addToast } = useLunovaStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  const pendingCount = proposals.filter((p: { phase: string }) => p.phase === 'in_review').length;

  const userInitials = (authUser?.name || authUser?.email || 'AU')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Check health against FastAPI backend
  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((res) => {
        if (res.ok) setBackendStatus('connected');
        else setBackendStatus('offline');
      })
      .catch(() => {
        setBackendStatus('offline');
      });
  }, []);

  return (
    <>
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

        {/* Right: Status, Tenant, Notifications, New Proposal, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Backend Connection Status Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-[#F8FAFC] border-[#E2E5E9]"
            title={
              backendStatus === 'connected'
                ? 'FastAPI Intelligence backend active on localhost:8000'
                : 'FastAPI backend inactive — running with high-fidelity local state'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'connected' ? 'bg-emerald-500' : 'bg-blue-400'
              }`}
            />
            <span className="text-gray-600">
              {backendStatus === 'connected' ? 'FastAPI Online' : 'Workspace Ready'}
            </span>
          </div>

          {/* Tenant Pill */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-2 border border-line text-xs font-mono font-semibold text-text">
            <Building2 className="w-3.5 h-3.5 text-accent" />
            <span>{storeUser?.tenant || 'Lunetron Technologies'}</span>
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

          {/* Primary Action: New Proposal */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">New Proposal</span>
            <span className="sm:hidden">New</span>
          </Button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          {/* User Profile Mini */}
          {isAuthenticated && authUser ? (
            <div
              className="flex items-center gap-2 pl-1 cursor-pointer"
              title={`${authUser.name || authUser.email} (${authUser.role})`}
              onClick={() => router.push('/settings')}
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
                {userInitials}
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/login')}
              className="text-xs"
            >
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* New Proposal Modal */}
      <NewProposalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
