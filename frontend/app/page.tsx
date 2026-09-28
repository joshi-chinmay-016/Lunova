'use client';

import React from 'react';
import Link from 'next/link';
import { useProposals } from '@/hooks/useProposals';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RecentProposalsTable } from '@/components/dashboard/RecentProposalsTable';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: proposals, isLoading, error, refetch } = useProposals();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* KPI Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-full" />
            </Card>
          ))}
        </div>

        {/* Content Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposals) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load proposal dashboard"
          message="We could not synchronize proposal records from your workspace. Please retry or verify your connection."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Calculate metrics
  const totalProposals = proposals.length;
  const inProgressCount = proposals.filter(
    (p) => p.status === 'NEW' || p.status === 'ANALYZING' || p.status === 'AI_DRAFTED'
  ).length;
  const underReviewCount = proposals.filter((p) => p.status === 'UNDER_REVIEW').length;
  const approvedCount = proposals.filter((p) => p.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Good morning, Sarah
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Here&apos;s what&apos;s happening with your proposals across active pipeline accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/proposals">
            <Button variant="secondary" size="sm">
              View All Proposals
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Proposals"
          value={totalProposals}
          description="Active and archived RFPs"
          change="+14% this month"
          trend="up"
          icon={FileText}
        />
        <KpiCard
          label="In Progress"
          value={inProgressCount}
          description="Ingestion & AI drafting"
          change="3 awaiting extraction"
          trend="neutral"
          icon={Clock}
        />
        <KpiCard
          label="Under Review"
          value={underReviewCount}
          description="Human verification station"
          change="Requires SME review"
          trend="neutral"
          icon={AlertCircle}
        />
        <KpiCard
          label="Approved"
          value={approvedCount}
          description="Signed & ready for submission"
          change="+$780K win pipeline"
          trend="up"
          icon={CheckCircle2}
        />
      </div>

      {/* Main Grid: Recent Proposals + Sidebar Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Proposals Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Recent Proposals</h3>
                <p className="text-[11px] text-gray-500">
                  Latest RFP submissions requiring action or monitoring
                </p>
              </div>
              <Link href="/proposals">
                <Button variant="ghost" size="sm" className="text-xs">
                  <span>See all</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              <RecentProposalsTable proposals={proposals.slice(0, 5)} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Deadlines & Activity */}
        <div className="space-y-6">
          <UpcomingDeadlines proposals={proposals} />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
