'use client';

import React from 'react';
import { BookOpen, CheckCircle2, AlertTriangle, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { VariableProximity } from './VariableProximity';

export const EvidenceGroundedSection: React.FC = () => {
  return (
    <section id="evidence" className="relative py-14 sm:py-16 lg:py-20 bg-gradient-to-b from-white via-blue-50/25 to-slate-50/20 border-b border-blue-100/70 overflow-hidden">
      {/* Crisp geometric grid (no blur) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.025)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with VariableProximity interaction */}
        <div className="max-w-2xl mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2.5 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Company Grounding</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 mb-2.5 leading-tight">
            Answers grounded in <span className="text-blue-600">what your company knows</span>.
          </h2>

          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal mb-4">
            Relevant company information should inform each response, and gaps should remain visible instead of being hidden behind confident-sounding language.
          </p>

          {/* Signature VariableProximity Effect */}
          <div className="p-3 px-4.5 rounded-xl bg-white border border-blue-100 shadow-sm inline-block hover:border-blue-300 transition-colors">
            <VariableProximity
              label="Every response starts with evidence."
              className="text-xs sm:text-sm font-semibold text-slate-800"
              radius={80}
            />
          </div>
        </div>

        {/* Polished Document-and-Evidence Composition with Alive Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Example 1: Evidence Available */}
          <div className="relative group bg-white rounded-3xl border border-blue-100 hover:border-emerald-400/80 p-7 sm:p-9 space-y-6 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
            {/* Hanging decorative badge */}
            <div className="hidden sm:flex absolute -top-5 right-8 flex-col items-center animate-hang origin-top pointer-events-none z-20">
              <div className="w-1 h-3.5 bg-emerald-500" />
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                100% Verified
              </span>
            </div>

            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">Example 01 • Verified Grounding</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Evidence Available
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Extracted Requirement</span>
                <p className="text-sm sm:text-base font-bold text-slate-900">
                  &ldquo;Describe your deployment model and multi-tenant isolation.&rdquo;
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Draft Response</span>
                <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                  Lunova operates dedicated single-tenant VPC deployments with automated failover across availability zones. Data isolation is maintained via tenant-partitioned database schemas with customer-managed encryption keys.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Deployment Architecture Guide</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium">Section 2.4 • Page 14</span>
                </div>
                <p className="text-xs text-slate-600 italic">
                  &ldquo;Production clusters utilize containerized worker pods isolated within client-specific virtual private clouds...&rdquo;
                </p>
              </div>
            </div>

            <div className="pt-3.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-emerald-700">Grounding status: 100% cited</span>
              <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">Traceable to source doc</span>
            </div>
          </div>

          {/* Example 2: Gap Surfaced / Additional Info Required */}
          <div className="relative group bg-white rounded-3xl border border-amber-200/90 hover:border-amber-400/80 p-7 sm:p-9 space-y-6 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
            {/* Hanging decorative badge */}
            <div className="hidden sm:flex absolute -top-5 right-8 flex-col items-center animate-hang origin-top pointer-events-none z-20">
              <div className="w-1 h-3.5 bg-amber-500" />
              <span className="px-3 py-1 rounded-full bg-amber-600 text-white text-[10px] font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-200" />
                Human Review Gate
              </span>
            </div>

            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">Example 02 • Gap Surfaced</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Additional Info Required
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Extracted Requirement</span>
                <p className="text-sm sm:text-base font-bold text-slate-900">
                  &ldquo;Provide details about the proposed implementation timeline and go-live SLA.&rdquo;
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Draft Response (Flagged)</span>
                <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                  Standard enterprise onboarding spans 4–6 weeks including VPC configuration and data ingestion. Specific milestone dates require client kickoff alignment before formal contract commitment.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Surfaced Boundary Condition</span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded">Review Gate</span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  Client did not specify expected go-live quarter in the RFP. Lunova highlighted this gap for Solutions Architect review rather than hallucinating arbitrary completion dates.
                </p>
              </div>
            </div>

            <div className="pt-3.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span className="font-semibold text-amber-700">Grounding status: Gap flagged</span>
              <span className="font-mono text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">Human judgment required</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
