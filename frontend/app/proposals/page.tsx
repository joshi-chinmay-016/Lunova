'use client';

import React, { useState, useMemo } from 'react';
import { useProposals } from '@/hooks/useProposals';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { RecentProposalsTable } from '@/components/dashboard/RecentProposalsTable';
import { NewProposalModal } from '@/components/proposals/NewProposalModal';
import { Search, Plus, Filter, FileSpreadsheet, RotateCcw } from 'lucide-react';

export default function ProposalsPage() {
  const { data: proposals, isLoading, error, refetch } = useProposals();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'deadline' | 'created_at' | 'title'>('deadline');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Extract unique customers
  const customers = useMemo(() => {
    if (!proposals) return [];
    return Array.from(new Set(proposals.map((p) => p.customer))).sort();
  }, [proposals]);

  // Filter and sort proposals
  const filteredProposals = useMemo(() => {
    if (!proposals) return [];

    return proposals
      .filter((p) => {
        const matchesSearch =
          !search ||
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.customer.toLowerCase().includes(search.toLowerCase()) ||
          p.owner.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        const matchesCustomer = customerFilter === 'ALL' || p.customer === customerFilter;

        return matchesSearch && matchesStatus && matchesCustomer;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline') {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === 'created_at') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.title.localeCompare(b.title);
      });
  }, [proposals, search, statusFilter, customerFilter, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCustomerFilter('ALL');
    setSortBy('deadline');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Proposals"
          description="Manage and review incoming proposal requests."
        />
        <Card className="p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (error || !proposals) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Proposals"
          description="Manage and review incoming proposal requests."
        />
        <ErrorState
          title="Unable to load proposals"
          message="Something went wrong while retrieving your proposals. You can try reloading."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'NEW', label: 'New' },
    { value: 'ANALYZING', label: 'Analyzing' },
    { value: 'AI_DRAFTED', label: 'AI Drafted' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  const customerOptions = [
    { value: 'ALL', label: 'All Customers' },
    ...customers.map((c) => ({ value: c, label: c })),
  ];

  const sortOptions = [
    { value: 'deadline', label: 'Sort by: Deadline (Soonest)' },
    { value: 'created_at', label: 'Sort by: Date Received' },
    { value: 'title', label: 'Sort by: Title (A-Z)' },
  ];

  const hasActiveFilters = search || statusFilter !== 'ALL' || customerFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Proposals"
        description="Manage, analyze, and review incoming enterprise proposal requests."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Proposals' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Proposal
          </Button>
        }
      />

      {/* Filter and Control Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="lg:col-span-1">
            <Input
              placeholder="Search by proposal or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>

          {/* Customer Filter */}
          <div>
            <Select
              options={customerOptions}
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            />
          </div>

          {/* Sort Selector */}
          <div>
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            />
          </div>
        </div>

        {/* Filter status row */}
        <div className="mt-3 pt-3 border-t border-[#E2E5E9] flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-gray-900">{filteredProposals.length}</strong> of{' '}
              <strong className="text-gray-900">{proposals.length}</strong> proposals
            </span>
            {hasActiveFilters && (
              <span className="text-blue-600 font-medium">Filtered</span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </Card>

      {/* Proposals List Card */}
      <Card>
        {filteredProposals.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title={hasActiveFilters ? 'No matching proposals' : 'No proposals yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search criteria or resetting active filters.'
                : 'When a proposal arrives, it will appear here.'
            }
            actionLabel={hasActiveFilters ? 'Reset Filters' : 'Create Proposal'}
            onAction={hasActiveFilters ? handleResetFilters : () => setIsNewModalOpen(true)}
          />
        ) : (
          <RecentProposalsTable proposals={filteredProposals} />
        )}
      </Card>

      {/* New Proposal Modal */}
      <NewProposalModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} />
    </div>
  );
}
