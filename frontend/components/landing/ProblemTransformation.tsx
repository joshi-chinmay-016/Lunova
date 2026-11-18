'use client';

import React from 'react';
import { ArrowRight, FileText, CheckCircle2, AlertCircle, Layers, Sparkles, Clock, ArrowDown } from 'lucide-react';

export const ProblemTransformation: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-28 lg:py-32 bg-gradient-to-b from-white via-blue-50/35 to-slate-50/20 border-b border-blue-100/70 overflow-hidden">
      {/* Subtle crisp geometric background (no blur) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.025)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>The Transformation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3 leading-tight">
            Proposal requests are <span className="text-blue-600">only the beginning</span>.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Finding the right information, connecting it to each requirement, and preparing a reliable response can take more work than writing the final answer.
          </p>
        </div>

        {/* Side-by-Side Transformation Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Side: Unstructured Request Friction */}
          <div className="group bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-9 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <span className="text-xs font-mono uppercase tracking-wider text-rose-600/90 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Before • Manual Assembly
                </span>
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Raw Inquiry</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Scattered questions across email threads &amp; PDFs
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Engineers search through stale Confluence pages, outdated sales decks, and chat messages trying to reconstruct accurate product specs.
                </p>
              </div>

              {/* Realistic Email Fragment */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono text-slate-700 leading-relaxed">
                <p className="text-slate-500 text-[11px] pb-1.5 border-b border-slate-200 font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Attachment: Security_Questionnaire_v3_Final.pdf (48 pages)
                </p>
                <p className="italic">
                  &ldquo;...Can you verify whether your customer keys support auto-rotation under AWS KMS? Also, does your high-availability configuration support multi-region cross-cloud failover, and what is your average onboarding velocity for 5,000+ seats?...&rdquo;
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Ambiguities and missing terms hidden within long paragraphs</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>SMEs repeatedly asked to answer the exact same questions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>No audit log of which document version supported each claim</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs font-mono text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                <Clock className="w-3.5 h-3.5" /> Turnaround: 4–8 business days
              </span>
              <span className="text-slate-400">High cognitive friction</span>
            </div>
          </div>

          {/* Right Side: Structured Lunova Intelligence */}
          <div className="relative group bg-gradient-to-b from-white to-blue-50/20 rounded-3xl border-2 border-blue-200/90 hover:border-blue-500/80 p-7 sm:p-9 flex flex-col justify-between space-y-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {/* Hanging decorative badge */}
            <div className="hidden sm:flex absolute -top-5 right-8 flex-col items-center animate-hang origin-top pointer-events-none z-20">
              <div className="w-1 h-3.5 bg-blue-500" />
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-blue-200" />
                Live Structured Output
              </span>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-blue-100">
                <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                  </span>
                  With Lunova • Grounded &amp; Structured
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  Automated Pipeline
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Requirements extracted, grounded in company truth
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Lunova decomposes the RFP into discrete requirements, maps each to corporate documentation, and drafts verified responses for SME sign-off.
                </p>
              </div>

              {/* Structured Requirement Cards with alive micro-interactions */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white border border-blue-100 hover:border-blue-300 shadow-xs hover:shadow-sm transition-all duration-200 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      SECURITY REQ 1
                    </span>
                    <p className="font-semibold text-slate-900">KMS customer-managed key rotation</p>
                    <p className="text-[11px] text-blue-700 font-mono">Evidence: Security Whitepaper 2026 §4.2</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full shrink-0 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Grounded
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-blue-100 hover:border-blue-300 shadow-xs hover:shadow-sm transition-all duration-200 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      ARCHITECTURE REQ 2
                    </span>
                    <p className="font-semibold text-slate-900">Multi-region active-passive failover</p>
                    <p className="text-[11px] text-blue-700 font-mono">Evidence: Disaster Recovery Plan §3.1</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full shrink-0 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Grounded
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 hover:border-amber-300 shadow-xs transition-all duration-200 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      TIMELINE GAP
                    </span>
                    <p className="font-semibold text-slate-900">5,000+ seat onboarding velocity</p>
                    <p className="text-[11px] text-amber-800 font-mono">Flagged: Requires Solutions Lead custom scope</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full shrink-0 border border-amber-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Needs Review
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-100 text-xs font-mono text-slate-700 flex items-center justify-between">
              <span className="font-bold text-blue-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Turnaround: Under 15 Minutes
              </span>
              <span className="font-bold text-emerald-600">Zero Hallucinations</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
