'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, Activity, FileCheck, Database, CheckCircle2 } from 'lucide-react';
import { TypewriterText } from './TypewriterText';
import { MagneticButton } from '@/components/ui/MagneticButton';

export const LandingHero: React.FC = () => {
  return (
    <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 md:pt-36 md:pb-24 border-b border-blue-100/60 overflow-hidden bg-transparent">
      {/* Subtle geometric grid overlay accent (pure pointer-events-none) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />

      {/* Gentle light ambient corner glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/30 via-sky-50/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-100/20 via-slate-50/10 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Asymmetric Editorial Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column (7 Cols): High-contrast, sharp typography over background */}
          <div className="lg:col-span-7 space-y-6 z-10">
            {/* Eyebrow Label with alive pulse */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-sm border border-blue-200/90 text-xs font-bold text-blue-900 tracking-wide shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              <span>PROPOSAL RESPONSE INTELLIGENCE</span>
            </div>

            {/* Restrained Enterprise Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[48px] font-extrabold tracking-tight text-slate-950 leading-[1.12]">
              Your company&apos;s knowledge.{' '}
              <span className="text-blue-600 block sm:inline">
                Ready for the next proposal.
              </span>
            </h1>

            {/* Typewriter Accent */}
            <div className="text-slate-900 font-semibold text-base sm:text-lg">
              <TypewriterText />
            </div>

            {/* Professional Supporting Copy */}
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal max-w-xl">
              Lunova turns incoming proposal requests into evidence-backed drafts, bringing company knowledge, requirements, and human review into one controlled workflow.
            </p>

            {/* Magnetic Action Buttons - Larger & Generously Padded to easily hold text */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <MagneticButton strength={0.2}>
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center justify-center gap-3 min-h-[54px] px-8 sm:px-10 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-bold shadow-md shadow-blue-500/25 hover:shadow-lg transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  <span>Explore Lunova</span>
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              </MagneticButton>

              <MagneticButton strength={0.15}>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2.5 min-h-[54px] px-8 sm:px-10 py-3.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 hover:text-blue-700 border-2 border-slate-200/90 hover:border-blue-300 text-base font-bold shadow-sm backdrop-blur-sm transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  <span>See how it works</span>
                </a>
              </MagneticButton>
            </div>

            {/* Trust Micro-Assurance */}
            <div className="pt-2 flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-600 shrink-0" />
              <span>Human review stays in control — Zero ungrounded claims fabricated.</span>
            </div>
          </div>

          {/* Right Column (5 Cols): Live Grounding Station with Frosted Glass Surface */}
          <div className="lg:col-span-5 relative">
            {/* Hanging Status Badge with subtle pendulum swing */}
            <div className="hidden sm:flex absolute -top-8 right-8 z-30 flex-col items-center animate-hang origin-top pointer-events-none">
              <div className="w-[1.5px] h-6 bg-gradient-to-b from-blue-300 to-blue-500" />
              <div className="px-3.5 py-1 rounded-full bg-white border border-blue-200 text-[10px] font-mono font-bold text-blue-700 shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ACTIVE GROUNDING • LIVE</span>
              </div>
            </div>

            {/* Alive Floating Micro-card */}
            <div className="hidden sm:flex absolute -bottom-6 -left-6 z-30 p-3.5 rounded-2xl bg-white border border-blue-100 shadow-xl items-center gap-3 animate-float transition-transform hover:scale-105">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Verification Engine</div>
                <div className="text-xs font-bold text-slate-900">Zero Fabrications Guaranteed</div>
              </div>
            </div>

            {/* Live Intelligence Grounding Station Card */}
            <div className="group relative rounded-3xl border-2 border-white/90 hover:border-blue-400/80 bg-white/92 backdrop-blur-md p-6 sm:p-7 shadow-2xl transition-all duration-300 space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                  </span>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                    Live Grounding Station
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-bold">
                  Lunetron Scoped
                </span>
              </div>

              {/* Inbound Requirement Block */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      Inbound Client Requirement
                    </span>
                    <span className="text-blue-700 font-bold">RFP-2026-NW-894</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-relaxed pt-0.5">
                    &ldquo;Does your cloud architecture support automated AWS KMS key rotation and cross-region failover?&rdquo;
                  </p>
                </div>

                {/* Grounded Evidence Citation */}
                <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Corporate Evidence
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-bold">
                      98.4% Confidence
                    </span>
                  </div>
                  <p className="text-xs text-emerald-950 font-semibold">
                    <strong className="text-emerald-700">[1]</strong> Lunetron_Cloud_Architecture_Whitepaper_v4.2.pdf (§4.2)
                  </p>
                  <p className="text-[11px] text-emerald-900/80 italic leading-relaxed">
                    &ldquo;Automated annual key rotation is natively enforced under AWS KMS with multi-region replication and sub-second failover.&rdquo;
                  </p>
                </div>
              </div>

              {/* Human Oversight Gate Telemetry */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>Retrieval: 142ms</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Traceable</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
