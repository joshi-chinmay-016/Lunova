'use client';

import React from 'react';
import { BookOpen, CheckCircle2, AlertTriangle, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { VariableProximity } from './VariableProximity';
import { BorderBeam } from '@/components/ui/BorderBeam';

export const EvidenceGroundedSection: React.FC = () => {
  return (
    <section id="evidence" className="relative py-16 sm:py-20 lg:py-24 border-b border-slate-200/80 overflow-hidden">
      {/* Crisp dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-800 mb-3.5 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>03 // Cryptographic Grounding</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-slate-950 mb-4 leading-tight">
            Responses grounded in{' '}
            <span className="text-gradient-aurora">verifiable corporate truth</span>.
          </h2>

          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans mb-5">
            Every factual statement connects back to an indexed document with exact paragraph and page coordinates. When knowledge is missing, Lunova surfaces the gap immediately rather than generating hallucinated approximations.
          </p>

          {/* Signature VariableProximity Effect with modern frame */}
          <div className="p-3.5 px-5 rounded-2xl glass-card inline-block border border-slate-200/90 shadow-sm">
            <VariableProximity
              label="Every claim links directly to immutable evidence."
              className="text-xs sm:text-sm font-display font-bold text-slate-900"
              radius={90}
            />
          </div>
        </div>

        {/* Polished Document-and-Evidence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Example 1: Evidence Available */}
          <div className="relative glass-card-interactive rounded-3xl p-7 sm:p-9 space-y-6 border border-emerald-200/90 bg-white/95 shadow-lg hover:shadow-xl transition-all duration-300">
            <BorderBeam size={160} duration={8} colorFrom="#10B981" colorTo="#06B6D4" borderWidth={1.5} />

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">
                Evidence Stream // 01
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Evidence Grounded
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Extracted Requirement
                </span>
                <p className="text-base sm:text-lg font-display font-bold text-slate-900">
                  &ldquo;Describe your cloud deployment architecture and multi-tenant isolation model.&rdquo;
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Synthesized Draft Response
                </span>
                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                  Lunova operates dedicated single-tenant VPC deployments with automated failover across availability zones. Data isolation is maintained via tenant-partitioned database schemas with customer-managed AWS KMS encryption keys.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5 hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-display font-bold text-slate-900">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Deployment Architecture Guide.pdf</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Section 2.4 • Page 14
                  </span>
                </div>
                <p className="text-xs text-slate-600 italic font-sans leading-relaxed">
                  &ldquo;Production clusters utilize containerized worker pods isolated within client-specific virtual private clouds with strict network boundary policies...&rdquo;
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs font-mono flex items-center justify-between text-slate-500">
              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Grounding Score: 99.4%
              </span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-medium">
                SHA-256 Provenance Verified
              </span>
            </div>
          </div>

          {/* Example 2: Gap Surfaced / Human Review Gate */}
          <div className="relative glass-card-interactive rounded-3xl p-7 sm:p-9 space-y-6 border border-amber-200/90 bg-white/95 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">
                Boundary Stream // 02
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                Human Review Gate
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Extracted Requirement
                </span>
                <p className="text-base sm:text-lg font-display font-bold text-slate-900">
                  &ldquo;Provide details regarding the proposed implementation timeline and go-live SLA commitments.&rdquo;
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Draft Response (Reviewer Flagged)
                </span>
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                  Standard enterprise onboarding spans 4–6 weeks including VPC configuration and data ingestion. Specific milestone dates require client kickoff alignment before formal contractual commitment.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-display font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Surfaced Boundary Condition</span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    Review Gate
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed font-sans">
                  The client inquiry omitted target start dates and regional rollout phases. Lunova flagged this requirement for Solutions Architect authorization rather than fabricating speculative milestones.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs font-mono flex items-center justify-between text-slate-500">
              <span className="font-bold text-amber-800">
                Grounding Status: Gap Flagged
              </span>
              <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md border border-amber-200 font-bold">
                Human Review Enforced
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
