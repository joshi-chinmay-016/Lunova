'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Zap, Lock } from 'lucide-react';
import { TypewriterText } from './TypewriterText';
import { ShinyButton } from '@/components/ui/ShinyButton';
import { LiveGroundingSimulator } from './LiveGroundingSimulator';

export const LandingHero: React.FC = () => {
  return (
    <section className="relative pt-28 pb-16 sm:pt-34 sm:pb-20 md:pt-40 md:pb-26 border-b border-emerald-100/40 overflow-hidden bg-transparent">
      {/* Subtle high-tech geometric grid lines (ReactBits style) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.035)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Ambient gradient auras */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-100/40 via-teal-50/20 to-transparent pointer-events-none rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-100/30 via-emerald-50/10 to-transparent pointer-events-none rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Asymmetric Editorial Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column (7 Cols): Commanding typography & high-contrast actions */}
          <div className="lg:col-span-7 space-y-6 z-10">
            {/* High-tech Eyebrow Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-emerald-200/90 text-xs font-mono font-bold text-emerald-900 tracking-wide shadow-[0_4px_16px_rgba(16,185,129,0.12)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>DETERMINISTIC AI PROPOSAL INTELLIGENCE</span>
            </div>

            {/* Catchy Display Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-[52px] lg:text-[56px] font-display font-extrabold tracking-tight text-slate-950 leading-[1.08]">
              Your company&apos;s knowledge.{' '}
              <span className="text-gradient-aurora block sm:inline">
                Ready for the next proposal.
              </span>
            </h1>

            {/* Typewriter Accent */}
            <div className="text-slate-900 font-display font-semibold text-base sm:text-xl">
              <TypewriterText />
            </div>

            {/* Professional Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-sans font-normal max-w-xl">
              Lunova ingests unstructured client RFP requirements, cross-references verified internal documents, and synthesizes evidence-backed answers with strict zero-hallucination oversight.
            </p>

            {/* Action Buttons: Shiny Specular Primary + Crisp Secondary */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link href="/dashboard">
                <ShinyButton variant="primary" icon={<ArrowRight className="w-4.5 h-4.5" />}>
                  Explore Lunova
                </ShinyButton>
              </Link>

              <a href="#how-it-works">
                <ShinyButton variant="secondary">
                  See how it works
                </ShinyButton>
              </a>
            </div>

            {/* Micro-Telemetry & Trust Guarantees */}
            <div className="pt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono font-medium text-slate-700">
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Deterministic Citations</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Hallucinations Fabricated</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Multi-Tenant Air-Gapped RAG</span>
              </span>
            </div>
          </div>

          {/* Right Column (5 Cols): Live Interactive Grounding Terminal */}
          <div className="lg:col-span-5 relative">
            <LiveGroundingSimulator />
          </div>
        </div>
      </div>
    </section>
  );
};
