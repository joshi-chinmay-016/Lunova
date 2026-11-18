'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { MagneticButton } from '@/components/ui/MagneticButton';

export const ProductPreviewSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'draft' | 'requirements' | 'evidence'>('draft');

  return (
    <section className="relative py-14 sm:py-16 lg:py-20 bg-gradient-to-b from-white via-blue-50/25 to-slate-50/20 border-b border-blue-100/70 overflow-hidden">
      {/* Crisp geometric grid (no blur) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.025)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Application Experience</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 mb-2.5 leading-tight">
              Designed for clarity in <span className="text-blue-600">every proposal detail</span>.
            </h2>
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
              The operational workspace brings RFP requirements, company evidence, and drafted responses into one high-density view.
            </p>
          </div>

          <MagneticButton strength={0.2} className="shrink-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-3 min-h-[50px] px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold shadow-md shadow-blue-500/25 hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Open Live Dashboard</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
          </MagneticButton>
        </div>

        {/* Art-Directed Product Interface Frame with Alive Hover & Hanging Indicator */}
        <div className="relative group bg-white rounded-3xl border border-blue-100 hover:border-blue-400/80 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
          {/* Hanging badge */}
          <div className="hidden sm:flex absolute -top-1 right-10 flex-col items-center animate-hang origin-top pointer-events-none z-30">
            <div className="w-1 h-3.5 bg-blue-600" />
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Workspace Preview
            </span>
          </div>
          {/* Workspace Title Header */}
          <div className="p-6 bg-paper/50 border-b border-line flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-muted uppercase">prop-acme-cloud-01</span>
                <span className="text-muted">•</span>
                <span className="font-semibold text-ink">Acme Corp</span>
                <span className="text-muted">•</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  Awaiting Review
                </span>
              </div>
              <h3 className="text-lg font-bold text-ink">
                Cloud Infrastructure &amp; Kubernetes Migration RFP
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/proposals/prop-acme-cloud-01/review">
                <button className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shadow-sm">
                  Review &amp; Sign Off
                </button>
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center border-b border-line px-6 bg-surface text-xs font-medium">
            <button
              onClick={() => setActiveTab('draft')}
              className={`py-3 px-3 border-b-2 -mb-px transition-colors ${
                activeTab === 'draft'
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              Response Draft &amp; Citations
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`py-3 px-3 border-b-2 -mb-px transition-colors ${
                activeTab === 'requirements'
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              Requirements Matrix (4)
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`py-3 px-3 border-b-2 -mb-px transition-colors ${
                activeTab === 'evidence'
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              Cited Knowledge (3)
            </button>
          </div>

          {/* Workspace Body */}
          <div className="p-6 sm:p-8">
            {activeTab === 'draft' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <div className="text-xs font-mono text-muted uppercase">Section 1: Technical &amp; Operational Response</div>
                  <div className="p-5 rounded-xl bg-paper/60 border border-line text-xs sm:text-sm text-ink leading-relaxed space-y-3 font-sans">
                    <p>
                      Lunova proposes a dedicated single-tenant Kubernetes infrastructure deployed across AWS us-east-1 and us-west-2 availability zones with automated active-passive failover{' '}
                      <span className="font-mono text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded border border-accent/20">
                        [DR Plan §3.1]
                      </span>
                      .
                    </p>
                    <p>
                      Customer data is protected via tenant-isolated KMS encryption keys with enforced 90-day rotation{' '}
                      <span className="font-mono text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded border border-accent/20">
                        [Security Whitepaper §4.2]
                      </span>
                      . Operational support includes 24/7 priority engineering response with a guaranteed 15-minute Sev-1 turnaround SLA.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Reviewer Flag:</span> Client requested custom VPC peering. Verify peering CIDR block constraints with Enterprise Network SME before final approval.
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs font-mono text-muted uppercase">Associated Knowledge Citations</div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-surface border border-line text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-ink">
                        <span>Disaster Recovery Plan.pdf</span>
                        <span className="text-[10px] font-mono text-muted">Page 18</span>
                      </div>
                      <p className="text-[11px] text-muted">
                        &ldquo;Multi-region failover triggers automatically upon RTO threshold breach of 120 seconds.&rdquo;
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-surface border border-line text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-ink">
                        <span>Security Whitepaper 2026.pdf</span>
                        <span className="text-[10px] font-mono text-muted">Page 7</span>
                      </div>
                      <p className="text-[11px] text-muted">
                        &ldquo;AES-256 data encryption at rest and TLS 1.3 in transit certified under SOC2 Type II.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'requirements' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-paper/60 border border-line flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold mr-2">TECHNICAL</span>
                    <strong className="text-ink">Multi-AZ AWS EKS deployment with Terraform automated provisioning</strong>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Fulfilled
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-paper/60 border border-line flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold mr-2">SECURITY</span>
                    <strong className="text-ink">SOC 2 Type II compliance and customer-managed KMS key rotation</strong>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Fulfilled
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold mr-2">TIMELINE</span>
                    <strong className="text-ink">Deployment completion date not specified in client inquiry</strong>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Flagged
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-paper/60 border border-line space-y-2 text-xs">
                  <div className="font-semibold text-ink">Cloud Case Study.pdf</div>
                  <p className="text-muted text-[11px]">Indexed 3 days ago • 12 chunks</p>
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-muted">
                    High Relevance
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-paper/60 border border-line space-y-2 text-xs">
                  <div className="font-semibold text-ink">Security Whitepaper 2026.pdf</div>
                  <p className="text-muted text-[11px]">Indexed 1 week ago • 28 chunks</p>
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-muted">
                    High Relevance
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-paper/60 border border-line space-y-2 text-xs">
                  <div className="font-semibold text-ink">Support SLA Agreement.pdf</div>
                  <p className="text-muted text-[11px]">Indexed 2 weeks ago • 8 chunks</p>
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-muted">
                    Medium Relevance
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
