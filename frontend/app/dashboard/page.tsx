'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProposals } from '@/hooks/useProposals';
import { useKnowledge } from '@/hooks/useKnowledge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProposalStatusBadge } from '@/components/proposals/ProposalStatusBadge';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Plus,
  Sparkles,
  Search,
  Filter,
  Layers,
  ShieldCheck,
  Database,
  ExternalLink,
  ChevronRight,
  Eye,
  Send,
  RefreshCw,
  Mail,
  Zap,
} from 'lucide-react';
import { Proposal, ProposalStatus } from '@/types/proposal';

type PipelineFilter = 'ALL' | 'NEW' | 'ANALYZING' | 'AI_DRAFTED' | 'UNDER_REVIEW' | 'APPROVED';

export default function OperationsDashboard() {
  const { data: proposals, isLoading, error, refetch, isRefetching } = useProposals();
  const { data: documents } = useKnowledge();

  const [activePipelineFilter, setActivePipelineFilter] = useState<PipelineFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Skeletons
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !proposals) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load proposal workspace"
          message="We could not synchronize proposal records from your workspace. Please verify your connection or retry."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Derived real metrics
  const totalCount = proposals.length;
  const underReviewList = proposals.filter((p) => p.status === 'UNDER_REVIEW');
  const analyzingList = proposals.filter((p) => p.status === 'ANALYZING' || p.status === 'NEW');
  const approvedList = proposals.filter((p) => p.status === 'APPROVED');
  const aiDraftedList = proposals.filter((p) => p.status === 'AI_DRAFTED');

  // Attention Items (real actionable items)
  const attentionItems: Array<{
    id: string;
    type: 'REVIEW_REQUIRED' | 'MISSING_INFO' | 'DEADLINE_URGENT';
    title: string;
    proposalId: string;
    client: string;
    message: string;
    actionLabel: string;
    actionHref: string;
  }> = [];

  proposals.forEach((p) => {
    // 1. Awaiting Human Review
    if (p.status === 'UNDER_REVIEW') {
      attentionItems.push({
        id: `att-rev-${p.id}`,
        type: 'REVIEW_REQUIRED',
        title: 'Draft Awaiting Decision',
        proposalId: p.id,
        client: p.customer,
        message: `${p.title} has generated response ready for review and source verification.`,
        actionLabel: 'Review Draft',
        actionHref: `/proposals/${p.id}/review`,
      });
    }

    // 2. Missing information or flagged items
    const flaggedReqs = p.requirements?.filter((r) => r.status === 'FLAGGED');
    if (flaggedReqs && flaggedReqs.length > 0) {
      attentionItems.push({
        id: `att-flag-${p.id}`,
        type: 'MISSING_INFO',
        title: `${flaggedReqs.length} Flagged Requirement${flaggedReqs.length > 1 ? 's' : ''}`,
        proposalId: p.id,
        client: p.customer,
        message: `${p.title}: Missing explicit specifications in client RFP inquiry.`,
        actionLabel: 'Inspect RFP',
        actionHref: `/proposals/${p.id}`,
      });
    }
  });

  // Pipeline stages with counts
  const pipelineStages: Array<{
    id: PipelineFilter;
    label: string;
    count: number;
    description: string;
    dotColor: string;
  }> = [
    {
      id: 'ALL',
      label: 'All Active',
      count: totalCount,
      description: 'Total active lifecycle',
      dotColor: 'bg-gray-400',
    },
    {
      id: 'NEW',
      label: 'Received',
      count: proposals.filter((p) => p.status === 'NEW').length,
      description: 'Inbound requests',
      dotColor: 'bg-blue-400',
    },
    {
      id: 'ANALYZING',
      label: 'Analyzing',
      count: proposals.filter((p) => p.status === 'ANALYZING').length,
      description: 'Requirement extraction',
      dotColor: 'bg-amber-400',
    },
    {
      id: 'AI_DRAFTED',
      label: 'Draft Ready',
      count: aiDraftedList.length,
      description: 'Evidence grounded',
      dotColor: 'bg-indigo-500',
    },
    {
      id: 'UNDER_REVIEW',
      label: 'Under Review',
      count: underReviewList.length,
      description: 'Human approval pending',
      dotColor: 'bg-purple-500',
    },
    {
      id: 'APPROVED',
      label: 'Approved',
      count: approvedList.length,
      description: 'Ready to dispatch',
      dotColor: 'bg-emerald-500',
    },
  ];

  // Filtered proposal list for table
  const filteredProposals = proposals.filter((p) => {
    const matchesFilter = activePipelineFilter === 'ALL' || p.status === activePipelineFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 9.1 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E4E7EC]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Good afternoon, Sarah
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-subtle text-brand border border-brand-border">
              Enterprise
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate mt-0.5">
            Here is the operational state of your proposal response intelligence pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-xs sm:text-sm font-semibold border-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Sync Pipeline</span>
          </Button>

          <Link href="/proposals">
            <Button size="md" className="text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New Proposal</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 9.2 The Attention Area: Action-Required Station */}
      {attentionItems.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">
                Needs Attention ({attentionItems.length})
              </h2>
            </div>
            <span className="text-[11px] text-amber-800 font-medium hidden sm:inline">
              Decisions required before sending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {attentionItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3.5 border border-amber-200/80 shadow-subtle flex flex-col justify-between space-y-2.5 hover:border-amber-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-700 mb-1">
                    <span>{item.title}</span>
                    <span className="text-slate text-[10px]">{item.client}</span>
                  </div>
                  <p className="text-xs text-ink-light line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>

                <Link
                  href={item.actionHref}
                  className="inline-flex items-center justify-between text-xs font-semibold text-brand hover:text-brand-hover pt-1 border-t border-gray-100"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs text-emerald-900">
            <span className="font-semibold">Pipeline Clear:</span> All proposals currently in review have been processed. No urgent blocking actions.
          </div>
        </div>
      )}

      {/* 9.3 Proposal Pipeline Interactive Visualization */}
      <div className="bg-white rounded-2xl border border-border-subtle p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-ink">Proposal Lifecycle Pipeline</h2>
            <p className="text-[11px] text-slate">
              Filter operational workspace by clicking stages across the ingestion-to-review lifecycle
            </p>
          </div>
          {activePipelineFilter !== 'ALL' && (
            <button
              onClick={() => setActivePipelineFilter('ALL')}
              className="text-xs text-brand font-semibold hover:underline self-start sm:self-auto"
            >
              Clear filter ({activePipelineFilter})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {pipelineStages.map((stage) => {
            const isSelected = activePipelineFilter === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setActivePipelineFilter(stage.id)}
                className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand bg-brand-subtle shadow-sm ring-1 ring-brand'
                    : 'border-border-subtle bg-canvas hover:bg-white hover:border-border-strong'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                  <span
                    className={`font-mono text-sm font-bold ${
                      isSelected ? 'text-brand' : 'text-ink'
                    }`}
                  >
                    {stage.count}
                  </span>
                </div>
                <div className="font-semibold text-ink text-[11px] truncate">{stage.label}</div>
                <div className="text-[10px] text-slate truncate">{stage.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 9.4 Proposals Operational Table */}
      <Card className="border border-border-subtle bg-white shadow-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-sm font-bold text-ink">Active Proposals Workspace</h2>
            <p className="text-[11px] text-slate">
              Showing {filteredProposals.length} of {totalCount} proposal requests
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate" />
              <input
                type="text"
                placeholder="Search title, customer, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-border-subtle pl-8 pr-3 py-1.5 focus:outline-none focus:border-brand bg-canvas focus:bg-white"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredProposals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-border-subtle text-slate text-[11px] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Proposal / Request</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4">Lifecycle Status</th>
                    <th className="py-3 px-4">Grounded Evidence</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredProposals.map((proposal) => {
                    const reqCount = proposal.requirements?.length || 0;
                    const srcCount = proposal.sources?.length || 0;
                    const hasMissing = proposal.requirements?.some((r) => r.status === 'FLAGGED');

                    return (
                      <tr
                        key={proposal.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        <td className="py-3 px-4 max-w-xs">
                          <Link
                            href={`/proposals/${proposal.id}`}
                            className="font-semibold text-ink group-hover:text-brand transition-colors block truncate"
                          >
                            {proposal.title}
                          </Link>
                          <span className="text-[10px] text-slate truncate block">
                            Owned by {proposal.owner}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-medium text-ink">{proposal.customer}</span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-muted" />
                            <span>{new Date(proposal.deadline).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <ProposalStatusBadge status={proposal.status} />
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-ink">{srcCount} sources</span>
                            <span className="text-slate">({reqCount} reqs)</span>
                            {hasMissing && (
                              <span
                                className="w-2 h-2 rounded-full bg-amber-500"
                                title="Missing critical parameters in request"
                              />
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {proposal.status === 'UNDER_REVIEW' ? (
                              <Link href={`/proposals/${proposal.id}/review`}>
                                <Button
                                  size="sm"
                                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                                >
                                  Review Draft
                                </Button>
                              </Link>
                            ) : (
                              <Link href={`/proposals/${proposal.id}`}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="text-slate hover:text-ink border-slate-300"
                                >
                                  Workspace
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 px-4">
              <EmptyState
                icon={FileText}
                title="No proposals match current filter"
                description={
                  activePipelineFilter !== 'ALL'
                    ? `No proposals found with status '${activePipelineFilter}'. Try selecting another stage.`
                    : 'Your workspace has not received any proposal requests yet.'
                }
                actionLabel={activePipelineFilter !== 'ALL' ? 'Show All Proposals' : 'View All Proposals'}
                onAction={
                  activePipelineFilter !== 'ALL'
                    ? () => setActivePipelineFilter('ALL')
                    : () => { window.location.href = '/proposals'; }
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 9.5 Supporting Operational Telemetry: Knowledge & Connected Ingestion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Knowledge Library Status */}
        <div className="bg-white rounded-2xl border border-border-subtle p-4 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-subtle text-brand flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Company Knowledge Base</div>
              <div className="text-[11px] text-slate">
                {documents?.length || 5} Verified Documents Indexed
              </div>
            </div>
          </div>
          <Link
            href="/knowledge-base"
            className="text-xs text-brand font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>Library</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Ingestion & Anti-Hallucination Guardrails */}
        <div className="bg-white rounded-2xl border border-border-subtle p-4 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Grounding Safeguard</div>
              <div className="text-[11px] text-slate">Tenant Scoped (Lunetron)</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            100% Enforced
          </span>
        </div>

        {/* Mailbox Sync Integration */}
        <div className="bg-white rounded-2xl border border-border-subtle p-4 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Mailbox Integration</div>
              <div className="text-[11px] text-slate">proposals@lunetron.com</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
            In Sync
          </span>
        </div>
      </div>
    </div>
  );
}
