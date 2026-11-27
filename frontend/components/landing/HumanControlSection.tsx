'use client';

import React from 'react';
import { Eye, Lock, UserCheck, ShieldCheck, Zap } from 'lucide-react';
import { BorderBeam } from '@/components/ui/BorderBeam';

const PRINCIPLES = [
  {
    icon: Eye,
    title: 'Evidence remains visible at all times',
    description:
      'Every draft statement is tied to an explicit section of your indexed documents. Reviewers can verify quotes alongside generated prose in real time.',
    tag: 'Continuous Auditability',
  },
  {
    icon: Lock,
    title: 'Missing information is never fabricated',
    description:
      'When an RFP demands specifications outside your company knowledge base, Lunova surfaces the gap immediately rather than generating speculative text.',
    tag: 'Strict Zero-Hallucination',
  },
  {
    icon: UserCheck,
    title: 'Humans retain unilateral authority',
    description:
      'Outbound dispatch requires explicit, multi-factor human sign-off. The platform accelerates preparation; your solutions team retains final veto power.',
    tag: 'Human-in-the-Loop',
  },
];

export const HumanControlSection: React.FC = () => {
  return (
    <section id="trust" className="relative py-16 sm:py-20 lg:py-24 bg-slate-950 text-white border-b border-slate-900 overflow-hidden">
      {/* Dark high-density cyber grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.08] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 mb-3.5 shadow-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>05 // Human Sovereignty</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white mb-4 leading-tight">
            The draft is synthesized.{' '}
            <span className="text-gradient-aurora">The decision is yours.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Lunova prepares the evidence and structures the proposal. Your team retains absolute responsibility for inspecting citations, resolving gaps, and approving outbound commitments.
          </p>
        </div>

        {/* 3 Principles Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
          {PRINCIPLES.map((p, idx) => {
            const Icon = p.icon;
            const isFeatured = idx === 1;
            return (
              <div
                key={idx}
                className={`relative group p-7 sm:p-8 rounded-3xl bg-slate-900/90 border space-y-4 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                  isFeatured
                    ? 'border-emerald-500/60'
                    : 'border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                {isFeatured && (
                  <BorderBeam size={140} duration={8} colorFrom="#10B981" colorTo="#06B6D4" borderWidth={1.5} />
                )}

                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                    {p.tag}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-display font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Operational Safeguard Banner */}
        <div className="mt-12 p-6 sm:p-7 rounded-2xl bg-slate-900/95 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-300 font-sans">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white font-display">Cryptographic Enclave:</strong> Customer documents are isolated per tenant and strictly quarantined from public foundation model training corpora.
            </span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700 shrink-0 font-bold">
            SOC2 Type II Enforced
          </span>
        </div>
      </div>
    </section>
  );
};
