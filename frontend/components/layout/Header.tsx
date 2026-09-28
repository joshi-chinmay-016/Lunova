'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NewProposalModal } from '@/components/proposals/NewProposalModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/proposals?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-[#E2E5E9] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {/* Left Section: Mobile Menu + Search */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search proposals, customers, requirements..."
              className="w-full bg-[#F4F5F7] text-gray-900 placeholder:text-gray-400 text-xs rounded-xl border border-[#E2E5E9] pl-9 pr-8 py-2 transition-all duration-150 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-block text-[10px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                ⌘K
              </kbd>
            </div>
          </form>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-3">
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

          {/* Notification Button */}
          <button
            className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
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
          <div className="flex items-center gap-2 pl-1 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
              SJ
            </div>
          </div>
        </div>
      </header>

      {/* New Proposal Modal */}
      <NewProposalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
