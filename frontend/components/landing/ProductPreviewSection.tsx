'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { ShinyButton } from '@/components/ui/ShinyButton';

export const ProductPreviewSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'draft' | 'requirements' | 'evidence'>('draft');

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 border-b border-slate-200/80 overflow-hidden">
      {/* High-tech dot matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-800 mb-3.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>06 // Operational Workspace</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-slate-950 mb-4 leading-tight">
              Designed for high-density,{' '}
              <span className="text-gradient-aurora">frictionless review</span>.
            </h2>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans">
              The Lunova workspace brings RFP requirements, vector evidence, and drafted responses into one high-clarity view for instant SME inspection.
            </p>
          </div>

          <div className="shrink-0">
            <ShinyButton
              href="/dashboard"
              className="min-h-[52px] px-8 py-3.5 text-sm sm:text-base font-display font-bold"
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </ShinyButton>
          </div>
        </div>

        {/* Product Interface Frame */}
        <div className="relative glass-card rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
          <BorderBeam size={220} duration={9} colorFrom="#10B981" colorTo="#06B6D4" borderWidth={1.5} />

          {/* Workspace Title Header */}
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 text-xs font-mono">
                <span className="text-slate-500 uppercase">PROP-2026-ACME-01</span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-slate-900">Acme Global Corporation</span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  Review Queue
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                Enterprise Cloud Infrastructure &amp; Kubernetes Architecture RFP
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/proposals/prop-acme-cloud-01/review">
                <button className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-display font-bold transition-all shadow-md cursor-pointer">
                  Inspect &amp; Authorize
                </button>
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-200 px-6 bg-white text-xs font-mono">
            <button
              onClick={() => setActiveTab('draft')}
              className={`py-3.5 px-4 border-b-2 font-bold transition-colors cursor-pointer ${
                activeTab === 'draft'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Response Draft &amp; Citations
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`py-3.5 px-4 border-b-2 font-bold transition-colors cursor-pointer ${
                activeTab === 'requirements'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Extracted Matrix (4)
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`py-3.5 px-4 border-b-2 font-bold transition-colors cursor-pointer ${
                activeTab === 'evidence'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Knowledge Citations (3)
            </button>
          </div>

          {/* Workspace Body */}
          <div className="p-6 sm:p-8 bg-white/70">
            {activeTab === 'draft' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                    Section 1: Technical &amp; Operational Security Response
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-3 font-sans shadow-xs">
                    <p>
                      Lunova operates dedicated single-tenant Kubernetes infrastructure deployed across AWS us-east-1 and us-west-2 availability zones with automated active-passive failover{' '}
                      <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                        [DR Plan §3.1]
                      </span>
                      .
                    </p>
                    <p>
                      Customer data is isolated via tenant-dedicated KMS encryption keys with enforced 90-day automated rotation{' '}
                      <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                        [Security Whitepaper §4.2]
                      </span>
                      . Operational support includes 24/7 priority engineering response with a guaranteed 15-minute Sev-1 turnaround SLA.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 font-sans">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Reviewer Flag:</span> Client requested custom VPC peering. Verify peering CIDR block constraints with Enterprise Network SME before final approval.
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                    Verified Citation Inspector
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        Disaster Recovery Runbook 2026
                      </span>
                      <span className="font-mono text-[11px] text-emerald-700 font-bold">98.2% Match</span>
                    </div>
                    <p className="text-slate-600 font-sans italic text-[11px] leading-relaxed">
                      &ldquo;Availability zone failover is orchestrated automatically by Route53 health checks with RTO &lt; 60 seconds and zero data loss.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'requirements' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-bold">SEC-01</span>
                    <p className="font-bold text-slate-900 mt-1">SOC2 Type II Audit Certification &amp; Boundary</p>
                  </div>
                  <span className="text-emerald-700 font-mono font-bold">Grounded</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-bold">INFRA-02</span>
                    <p className="font-bold text-slate-900 mt-1">Multi-Region Kubernetes Pod Deployment</p>
                  </div>
                  <span className="text-emerald-700 font-mono font-bold">Grounded</span>
                </div>
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900">Security Whitepaper 2026.pdf</span>
                  </div>
                  <span className="font-mono text-emerald-700 font-bold">SHA-256 Verified</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
