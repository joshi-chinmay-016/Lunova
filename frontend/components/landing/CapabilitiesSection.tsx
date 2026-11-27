'use client';

import React from 'react';
import {
  FileSearch,
  BookMarked,
  FileCheck,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Database,
  Lock,
} from 'lucide-react';
import { BorderBeam } from '@/components/ui/BorderBeam';

export const CapabilitiesSection: React.FC = () => {
  return (
    <section id="capabilities" className="relative py-16 sm:py-20 lg:py-24 border-b border-slate-200/80 overflow-hidden">
      {/* High-tech dot matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-800 mb-3.5 shadow-xs">
            <FileSearch className="w-3.5 h-3.5 text-emerald-600" />
            <span>07 // Core Systems</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-slate-950 mb-4 leading-tight">
            Engineered around verifiable evidence,{' '}
            <span className="text-gradient-aurora">never approximations</span>.
          </h2>
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans">
            Five core capabilities designed specifically for enterprise proposal responses, technical RFPs, and security questionnaires.
          </p>
        </div>

        {/* Feature Grid: 1 Large + 2 Medium + 2 Small */}
        <div className="space-y-6 sm:space-y-8">
          {/* 1 Large Capability */}
          <div className="relative glass-card-interactive p-7 sm:p-9 rounded-3xl border border-emerald-200/90 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/90">
            <BorderBeam size={180} duration={8} colorFrom="#10B981" colorTo="#06B6D4" borderWidth={1.5} />

            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">
                Capability 01 // Air-Gapped Retrieval
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 leading-snug">
                Company knowledge retrieval with strict tenant boundaries.
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Lunova indexes corporate whitepapers, architecture specifications, and compliance certifications into an isolated vector store. Cosine similarity thresholds prevent low-relevance documents from polluting drafts.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-bold text-emerald-800">Multi-page PDF parsing</span>
                <span className="px-3 py-1 rounded-lg bg-cyan-50 border border-cyan-200 font-bold text-cyan-800">Strict cosine filtering</span>
                <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-bold text-emerald-800">Zero cross-tenant bleed</span>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 font-mono">
                <span className="font-bold text-slate-900">Isolated Vector Store</span>
                <span className="text-emerald-700 font-bold">Tenant: Lunetron Core</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                  <span className="text-slate-800 font-medium">SOC2_Audit_Report_2026.pdf</span>
                  <span className="text-emerald-700 font-bold">100% Vector Indexed</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                  <span className="text-slate-800 font-medium">AWS_Reference_Architecture.docx</span>
                  <span className="text-emerald-700 font-bold">100% Vector Indexed</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                  <span className="text-slate-800 font-medium">Enterprise_Support_SLA.pdf</span>
                  <span className="text-emerald-700 font-bold">100% Vector Indexed</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2 Medium Supporting Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <FileSearch className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Capability 02 // Decomposition
              </span>
              <h3 className="text-lg font-display font-bold text-slate-900">
                Proposal request decomposition
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Deconstructs multi-part inquiry letters, questionnaire tables, and attached RFP specifications into categorized technical, security, and operational requirements.
              </p>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Capability 03 // Gap Visibility
              </span>
              <h3 className="text-lg font-display font-bold text-slate-900">
                Missing-information visibility
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Surfaces ambiguities, omitted timelines, and missing evidence clearly so your solutions team can intervene rather than submitting speculative assertions.
              </p>
            </div>
          </div>

          {/* 2 Typographic Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            <div className="p-6 rounded-2xl border-l-4 border-emerald-500 bg-white/90 border border-slate-200 space-y-2 shadow-xs">
              <span className="text-xs font-mono uppercase text-emerald-700 font-bold">Capability 04 // Drafting</span>
              <h4 className="text-base font-display font-bold text-slate-900">Evidence-backed draft synthesis</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Assembles professional responses where every statement cites the underlying corporate document, enabling fast verification by subject matter experts.
              </p>
            </div>

            <div className="p-6 rounded-2xl border-l-4 border-cyan-500 bg-white/90 border border-slate-200 space-y-2 shadow-xs">
              <span className="text-xs font-mono uppercase text-cyan-700 font-bold">Capability 05 // Governance</span>
              <h4 className="text-base font-display font-bold text-slate-900">Human review &amp; sign-off workflow</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Empowers technical leads to inspect evidence, edit paragraphs, add internal sign-off notes, and authorize dispatch through an immutable review trail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
