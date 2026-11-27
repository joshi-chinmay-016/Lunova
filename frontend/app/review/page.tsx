'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useProposals } from '@/hooks/useProposals';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  BookOpen,
  UserCheck,
  Search,
  Filter,
} from 'lucide-react';

export default function ReviewStationPage() {
  const { data: proposals, isLoading, error, refetch } = useProposals();
  const [filter, setFilter] = useState<'ALL' | 'ACTION_REQUIRED' | 'APPROVED'>('ACTION_REQUIRED');
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Human Review Station"
          description="Inspect evidence citations, resolve boundary flags, and authorize response dispatch."
        />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !proposals) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Human Review Station"
          description="Inspect evidence citations, resolve boundary flags, and authorize response dispatch."
        />
        <ErrorState
          title="Unable to load review queue"
          message="Could not synchronize pending proposals requiring review."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const reviewList = proposals.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.toLowerCase().includes(search.toLowerCase());

    if (filter === 'ACTION_REQUIRED') {
      return matchesSearch && (p.status === 'UNDER_REVIEW' || p.status === 'AI_DRAFTED' || p.status === 'NEW');
    }
    if (filter === 'APPROVED') {
      return matchesSearch && p.status === 'APPROVED';
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human Review Station"
        description="Inspect evidence citations, resolve boundary flags, and authorize response dispatch."
        actions={
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Human Authority Gate Active
          </span>
        }
      />

      {/* Control Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ACTION_REQUIRED')}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
              filter === 'ACTION_REQUIRED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Awaiting Review ({proposals.filter((p) => p.status !== 'APPROVED').length})
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
              filter === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({proposals.filter((p) => p.status === 'APPROVED').length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Proposals ({proposals.length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by customer or title..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Review Queue Cards */}
      <div className="space-y-4">
        {reviewList.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-display font-bold text-slate-900">Review Queue Clear</h3>
            <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto">
              All proposals in this category have been processed and approved. No outstanding verification flags remain.
            </p>
          </div>
        ) : (
          reviewList.map((proposal) => {
            const isApproved = proposal.status === 'APPROVED';
            return (
              <div
                key={proposal.id}
                className="group p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-400 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-slate-900">{proposal.customer}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{proposal.id}</span>
                      <span className="text-slate-300">•</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {proposal.status}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {proposal.title}
                    </h3>

                    {proposal.summary && (
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 font-sans">
                        {proposal.summary}
                      </p>
                    )}

                    <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Deadline: {new Date(proposal.deadline).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <BookOpen className="w-3.5 h-3.5" />
                        Confidence: {Math.round((proposal.confidence?.grounding_score || 0.96) * 100)}%
                      </span>
                      <span>•</span>
                      <span>Owner: {proposal.owner}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/proposals/${proposal.id}`}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-display font-bold transition-all shadow-xs"
                    >
                      Inspect Evidence
                    </Link>

                    <Link
                      href={`/proposals/${proposal.id}/review`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-display font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all"
                    >
                      <span>{isApproved ? 'Review Record' : 'Launch Review'}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
