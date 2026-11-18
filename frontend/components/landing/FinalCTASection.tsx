'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { MagneticButton } from '@/components/ui/MagneticButton';

export const FinalCTASection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-28 lg:py-32 bg-gradient-to-b from-blue-50/70 via-white to-sky-50/50 text-slate-900 border-b border-blue-100/70 overflow-hidden">
      {/* Crisp geometric grid (no blur) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-semibold uppercase tracking-wider text-blue-700 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Ready When It Matters</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight max-w-2xl mx-auto">
          Give every proposal request a{' '}
          <span className="text-blue-600 block sm:inline">more considered response</span>.
        </h2>

        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
          Bring company knowledge and human judgment into one controlled proposal-response workflow.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <MagneticButton strength={0.25}>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2.5 h-12 px-7 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold shadow-md shadow-blue-500/25 hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Explore the workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </MagneticButton>

          <MagneticButton strength={0.2}>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-white hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 border border-slate-300 hover:border-blue-300 text-sm sm:text-base font-semibold shadow-sm transition-all cursor-pointer"
            >
              <span>Explore the workflow</span>
            </a>
          </MagneticButton>
        </div>

        <div className="pt-8 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-600">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>Strict tenant isolation • Zero autonomous sending • 100% human oversight</span>
        </div>
      </div>
    </section>
  );
};
