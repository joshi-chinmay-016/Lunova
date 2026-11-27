'use client';

import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Sparkles, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { BorderBeam } from '@/components/ui/BorderBeam';

export const ProblemTransformation: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 border-b border-slate-200/80 overflow-hidden">
      {/* High-tech dot-matrix grid with subtle cyan glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.06] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-800 mb-3.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>01 // System Transformation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-slate-950 mb-4 leading-tight">
            Proposal requests are{' '}
            <span className="text-gradient-aurora">just the entry vector</span>.
          </h2>
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans">
            Sifting through stale Confluence pages, disconnected spreadsheets, and fragmented chat history drains engineering velocity. Lunova transforms unstructured inbound requests into cryptographically grounded, review-ready deliverables.
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Side: Legacy Chaos */}
          <div className="glass-card rounded-3xl p-7 sm:p-9 flex flex-col justify-between space-y-6 border border-rose-200/70 bg-gradient-to-b from-white/90 via-rose-50/20 to-white/90 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-rose-100">
                <span className="text-xs font-mono uppercase tracking-wider text-rose-700 font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  Legacy RFP Chaos • 4-8 Day Delay
                </span>
                <span className="text-xs font-mono text-slate-600 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-md font-medium">
                  Unstructured Input
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                  Scattered inquiries across buried email threads &amp; PDFs
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                  Subject matter experts get pinged repeatedly for the same answers, while teams copy-paste outdated paragraphs that risk customer churn or compliance fines.
                </p>
              </div>

              {/* Realistic Raw Inbound Fragment */}
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 space-y-2.5 text-xs font-mono leading-relaxed shadow-inner">
                <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    Vendor_Sec_Questionnaire_v4.2.pdf
                  </span>
                  <span className="text-rose-400 font-mono">148 Pages</span>
                </div>
                <p className="text-slate-300 font-mono text-[12px] leading-relaxed">
                  <span className="text-rose-400">&gt; Req 4.19:</span> &ldquo;Describe customer KMS key rotation cadence, disaster recovery RTO/RPO guarantees, SOC2 Type II cert boundary, and multi-region cross-cloud active-active failover capabilities...&rdquo;
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 pt-1 font-sans">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-medium text-slate-700">Zero cryptographic audit trail for assertions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-medium text-slate-700">Ambiguities hidden inside verbose prose</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-medium text-slate-700">SMEs lose 30%+ of engineering sprint capacity</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-rose-100 text-xs font-mono flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                <Clock className="w-4 h-4" /> Avg Turnaround: 5 business days
              </span>
              <span className="text-rose-600/90 font-medium">High Cognitive Drift</span>
            </div>
          </div>

          {/* Right Side: Lunova AI Intelligence */}
          <div className="relative glass-card-interactive rounded-3xl p-7 sm:p-9 flex flex-col justify-between space-y-6 border-2 border-emerald-300/80 bg-gradient-to-b from-white/95 via-emerald-50/25 to-white/95 shadow-xl">
            <BorderBeam size={180} duration={8} colorFrom="#10B981" colorTo="#0284C7" borderWidth={2} />

            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Lunova Intelligence Engine
                </span>
                <span className="text-xs font-mono text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-3 py-1 rounded-full font-bold">
                  Zero Hallucination
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                  Decomposed into verifiable claims with linked proof
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                  The parser extracts every contractual obligation, queries tenant-isolated vector stores, and synthesizes answers verified down to the paragraph.
                </p>
              </div>

              {/* Structured Requirement Cards */}
              <div className="space-y-3 font-sans">
                <div className="p-3.5 rounded-2xl bg-white border border-emerald-200/90 shadow-sm flex items-start justify-between gap-3 text-xs hover:border-emerald-400 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                        SEC-REQ-01
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 font-medium">99.2% cosine match</span>
                    </div>
                    <p className="font-semibold text-slate-900">AWS KMS Customer-Managed Key Rotation</p>
                    <p className="text-[11px] text-slate-600 font-mono">Source: Security_Architecture_2026.pdf §4.2</p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-cyan-200/90 shadow-sm flex items-start justify-between gap-3 text-xs hover:border-cyan-400 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-300">
                        INFRA-REQ-02
                      </span>
                      <span className="text-[11px] font-mono text-cyan-700 font-medium">96.8% cosine match</span>
                    </div>
                    <p className="font-semibold text-slate-900">Multi-Region Cross-Cloud Active-Passive Failover</p>
                    <p className="text-[11px] text-slate-600 font-mono">Source: Disaster_Recovery_Runbook.md §1.7</p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-cyan-800 bg-cyan-100 px-2.5 py-1 rounded-full shrink-0 border border-cyan-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                    Verified
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300/80 shadow-sm flex items-start justify-between gap-3 text-xs hover:border-amber-400 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                        HUMAN-GATE
                      </span>
                      <span className="text-[11px] font-mono text-amber-800 font-medium">Gap Detected</span>
                    </div>
                    <p className="font-semibold text-slate-900">5,000+ Seat Onboarding Migration Velocity</p>
                    <p className="text-[11px] text-amber-900 font-mono">Flagged: Requires Solutions VP Custom Schedule</p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-200 px-2.5 py-1 rounded-full shrink-0 border border-amber-300 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    Human Gate
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-100 text-xs font-mono flex items-center justify-between">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600" /> Latency: 4.8s per proposal section
              </span>
              <span className="font-bold text-slate-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                100% Deterministic Evidence
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
