'use client';

import React from 'react';
import {
  FileSearch,
  BookMarked,
  FileCheck,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export const CapabilitiesSection: React.FC = () => {
  return (
    <section id="capabilities" className="relative py-14 sm:py-16 lg:py-20 bg-gradient-to-b from-slate-50/20 via-blue-50/30 to-white border-b border-blue-100/70 overflow-hidden">
      {/* Crisp geometric grid (no blur) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.025)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-2xl mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2.5 shadow-xs">
            <FileSearch className="w-3.5 h-3.5 text-blue-600" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 mb-2.5 leading-tight">
            Engineered around evidence, <span className="text-blue-600">not guesswork</span>.
          </h2>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
            Five core capabilities designed specifically for enterprise proposal responses, technical RFPs, and security questionnaires.
          </p>
        </div>

        {/* Varied Editorial Layout: 1 Large Feature + 2 Medium + 2 Typographic */}
        <div className="space-y-6 sm:space-y-8">
          {/* 1 Large Capability with Detailed Visual */}
          <div className="p-7 sm:p-9 rounded-3xl bg-white border border-blue-100 hover:border-blue-400/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-3.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
                Capability 01 • Grounded Retrieval
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                Company knowledge retrieval with strict tenant boundaries.
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Lunova indexes your corporate whitepapers, architecture specifications, and compliance certifications into an isolated vector store. Cosine similarity thresholds prevent low-relevance documents from polluting drafts.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-slate-600">
                <span className="px-3 py-1 rounded-lg bg-blue-50/60 border border-blue-100 font-semibold text-blue-700">Multi-page PDF parsing</span>
                <span className="px-3 py-1 rounded-lg bg-blue-50/60 border border-blue-100 font-semibold text-blue-700">Strict cosine filtering</span>
                <span className="px-3 py-1 rounded-lg bg-blue-50/60 border border-blue-100 font-semibold text-blue-700">Zero cross-tenant bleed</span>
              </div>
            </div>

            <div className="lg:col-span-6 bg-surface p-6 rounded-xl border border-line space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-line">
                <span className="font-semibold text-ink">Indexed Knowledge Base</span>
                <span className="font-mono text-muted text-[11px]">Tenant: Lunetron Core</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-paper/50 border border-line flex items-center justify-between">
                  <span className="text-ink font-medium">SOC2_Audit_Report_2026.pdf</span>
                  <span className="text-emerald-700 font-mono text-[10px]">100% Vector Indexed</span>
                </div>
                <div className="p-2.5 rounded-lg bg-paper/50 border border-line flex items-center justify-between">
                  <span className="text-ink font-medium">AWS_Reference_Architecture.docx</span>
                  <span className="text-emerald-700 font-mono text-[10px]">100% Vector Indexed</span>
                </div>
                <div className="p-2.5 rounded-lg bg-paper/50 border border-line flex items-center justify-between">
                  <span className="text-ink font-medium">Enterprise_Support_SLA.pdf</span>
                  <span className="text-emerald-700 font-mono text-[10px]">100% Vector Indexed</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2 Medium Supporting Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 sm:p-8 rounded-2xl bg-paper/60 border border-line space-y-4">
              <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center text-accent">
                <FileSearch className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                Capability 02 • Understanding
              </span>
              <h3 className="text-lg font-semibold text-ink">
                Proposal request decomposition
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
                Deconstructs multi-part inquiry letters, questionnaire tables, and attached RFP specifications into categorized technical, security, and operational requirements.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-paper/60 border border-line space-y-4">
              <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                Capability 03 • Visibility
              </span>
              <h3 className="text-lg font-semibold text-ink">
                Missing-information visibility
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
                Surfaces ambiguities, omitted timelines, and missing evidence clearly so your solutions team can intervene rather than submitting speculative assertions.
              </p>
            </div>
          </div>

          {/* 2 Typographic Supporting Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="p-6 rounded-xl border-l-2 border-accent bg-paper/30 space-y-2">
              <span className="text-xs font-mono uppercase text-muted font-semibold">Capability 04 • Drafting</span>
              <h4 className="text-base font-semibold text-ink">Evidence-backed draft synthesis</h4>
              <p className="text-xs text-muted leading-relaxed">
                Assembles professional responses where every statement cites the underlying corporate document, enabling fast verification by subject matter experts.
              </p>
            </div>

            <div className="p-6 rounded-xl border-l-2 border-accent bg-paper/30 space-y-2">
              <span className="text-xs font-mono uppercase text-muted font-semibold">Capability 05 • Governance</span>
              <h4 className="text-base font-semibold text-ink">Human review &amp; sign-off workflow</h4>
              <p className="text-xs text-muted leading-relaxed">
                Empowers technical leads to inspect evidence, edit paragraphs, add internal sign-off notes, and authorize dispatch through an immutable review trail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
