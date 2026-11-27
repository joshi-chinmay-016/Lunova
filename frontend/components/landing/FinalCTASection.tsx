'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { ShinyButton } from '@/components/ui/ShinyButton';
import { BorderBeam } from '@/components/ui/BorderBeam';

export const FinalCTASection: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 border-b border-slate-200/80 overflow-hidden">
      {/* High-tech dot matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative glass-card rounded-3xl p-8 sm:p-14 text-center border-2 border-emerald-300/80 shadow-2xl bg-white/95 overflow-hidden">
          <BorderBeam size={220} duration={8} colorFrom="#10B981" colorTo="#06B6D4" borderWidth={2} />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-800 shadow-xs mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ready For Production Deployments</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-slate-950 leading-tight max-w-3xl mx-auto mb-4">
            Give every enterprise proposal request a{' '}
            <span className="text-gradient-aurora block sm:inline">mathematically verified response</span>.
          </h2>

          <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed font-sans mb-8">
            Stop losing engineering cycles to manual questionnaire assembly. Bring corporate documentation and human authority into one controlled, auditable workflow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <ShinyButton
              href="/dashboard"
              className="min-h-[56px] px-8 sm:px-10 py-4 text-base font-display font-bold shadow-lg"
            >
              <span>Explore Live Workspace</span>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </ShinyButton>

            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2.5 min-h-[56px] px-8 sm:px-9 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 border border-slate-300 hover:border-slate-400 text-sm sm:text-base font-display font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Review System Architecture</span>
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-600">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              Tenant-Isolated Vectors
            </span>
            <span className="text-slate-300">•</span>
            <span>Zero Autonomous Sending</span>
            <span className="text-slate-300">•</span>
            <span>100% Deterministic Evidence</span>
          </div>
        </div>
      </div>
    </section>
  );
};
