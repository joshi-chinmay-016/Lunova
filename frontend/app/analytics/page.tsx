'use client';

import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  PieChart,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error, refetch } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Proposal Analytics"
          description="Operational metrics and requirement intelligence across pipeline proposals."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-full" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Proposal Analytics"
          description="Operational metrics and requirement intelligence across pipeline proposals."
        />
        <ErrorState
          title="Unable to load analytics"
          message="Could not load metrics data."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proposal Analytics"
        description="Operational throughput, turnaround velocity, and requirement category distribution."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Analytics' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.kpis.map((kpi) => (
          <Card key={kpi.id} className="p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">{kpi.value}</h3>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 truncate">{kpi.description}</span>
              <span className="font-semibold text-emerald-700 text-[11px] shrink-0">
                {kpi.change}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">Proposals by Status</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {analytics.proposals_by_status.map((item) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{item.status}</span>
                    <span className="text-gray-500 font-mono">
                      {item.count} proposals ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#EEF0F3] rounded-full h-2 overflow-hidden shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requirements by Category */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">Extracted Requirements by Category</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {analytics.requirements_by_category.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{item.category}</span>
                    <span className="text-gray-500 font-mono">
                      {item.count} criteria ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#EEF0F3] rounded-full h-2 overflow-hidden shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Velocity & Future Capabilities Note */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">Proposal Velocity & Approval Trend</h3>
            </div>
            <span className="text-xs text-gray-500 font-mono">Last 5 Months</span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Simple Clean Bar Chart Representation */}
          <div className="grid grid-cols-5 gap-4 pt-4 pb-2 items-end h-44">
            {analytics.monthly_velocity.map((m) => (
              <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="flex items-end gap-1.5 w-full justify-center h-32">
                  <div
                    className="w-5 sm:w-8 bg-[#EEF0F3] border border-gray-300 rounded-t-lg transition-all"
                    style={{ height: `${(m.total / 30) * 100}%` }}
                    title={`Total: ${m.total}`}
                  />
                  <div
                    className="w-5 sm:w-8 bg-blue-600 rounded-t-lg transition-all"
                    style={{ height: `${(m.approved / 30) * 100}%` }}
                    title={`Approved: ${m.approved}`}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700">{m.month}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[#E2E5E9] text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#EEF0F3] border border-gray-300" />
              <span className="text-gray-600">Total Ingested</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-600" />
              <span className="text-gray-600">Approved & Submitted</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future Roadmap Analytics Note */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-blue-900">Upcoming Intelligence Metrics</p>
          <p className="text-blue-700 leading-relaxed">
            Future updates will provide CRM win/loss correlation, bid-competitor pricing bands, and automated capability gap alerts based on common customer RFP inquiries.
          </p>
        </div>
      </div>
    </div>
  );
}
