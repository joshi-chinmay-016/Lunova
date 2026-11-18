'use client';

import React from 'react';
import { ShieldCheck, Eye, Lock, UserCheck } from 'lucide-react';

const PRINCIPLES = [
  {
    icon: Eye,
    title: 'Evidence remains visible',
    description:
      'Every draft assertion links back to an explicit section of your company’s indexed documents. Reviewers can inspect the supporting text directly alongside the drafted answer.',
  },
  {
    icon: Lock,
    title: 'Missing information is never hidden',
    description:
      'When an RFP asks for specifications outside your company knowledge base, Lunova surfaces the gap for human resolution rather than generating speculative filler.',
  },
  {
    icon: UserCheck,
    title: 'Humans retain final authority',
    description:
      'Outbound email sending and proposal submission require explicit human authorization. The system prepares and accelerates; your team approves and decides.',
  },
];

export const HumanControlSection: React.FC = () => {
  return (
    <section id="trust" className="relative py-24 sm:py-28 lg:py-32 bg-slate-950 text-white border-b border-slate-900 overflow-hidden">
      {/* Crisp geometric dark grid with subtle blue accents (no blur) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3 shadow-xs">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Human Authority &amp; Enterprise Trust</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
            The draft is generated. <span className="text-blue-400">The decision is yours.</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Lunova helps prepare the response. Your team remains responsible for reviewing the evidence, resolving missing details, and approving what goes out.
          </p>
        </div>

        {/* 3 Principles Grid with Alive Hover Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
          {PRINCIPLES.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="group relative p-7 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-blue-500/80 space-y-4 shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300"
              >
                {idx === 1 && (
                  <div className="hidden sm:flex absolute -top-4 right-6 flex-col items-center animate-hang origin-top pointer-events-none z-20">
                    <div className="w-1 h-3 bg-blue-500" />
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-mono font-bold tracking-wider uppercase shadow-md">
                      Human Review Gate
                    </span>
                  </div>
                )}

                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shadow-sm group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Operational Safeguard Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
            <span>
              <strong className="text-white">Strict Boundary Isolation:</strong> Company knowledge is isolated per tenant and never used to train global public models.
            </span>
          </div>
          <span className="font-mono text-[11px] text-blue-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 shrink-0">
            Air-Gapped Workflow
          </span>
        </div>
      </div>
    </section>
  );
};
