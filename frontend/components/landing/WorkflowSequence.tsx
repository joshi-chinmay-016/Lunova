'use client';

import React from 'react';
import {
  Inbox,
  Sparkles,
  Database,
  FileCheck2,
  UserCheck,
  Send,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Capture the request',
    headline: 'Inbound email & attachment intake',
    description:
      'Receive inbound business inquiries, RFPs, or requirements documents directly from your connected mailbox or document upload. PDF, DOCX, and TXT files are parsed page-by-page.',
    icon: Inbox,
    tag: 'Intake Engine',
  },
  {
    step: '02',
    title: 'Understand what is asked',
    headline: 'Requirement & gap extraction',
    description:
      'The reasoning engine extracts discrete requirements, classifies priorities, preserves verbatim evidence, and flags missing specifications (e.g. absent timelines or budget figures).',
    icon: Search,
    tag: 'Extraction',
  },
  {
    step: '03',
    title: 'Find company evidence',
    headline: 'Tenant-safe vector retrieval',
    description:
      'Searches internal company whitepapers, SLA sheets, and case studies. Enforces strict PostgreSQL partition boundaries so no cross-company data is ever retrieved.',
    icon: Database,
    tag: 'RAG Retrieval',
  },
  {
    step: '04',
    title: 'Prepare a grounded draft',
    headline: 'Evidence-backed drafting',
    description:
      'Generates a tailored response email draft where every assertion links to a verified document citation. Prohibits hallucinated pricing, delivery dates, or capabilities.',
    icon: FileCheck2,
    tag: 'Generation',
  },
  {
    step: '05',
    title: 'Review and approve',
    headline: 'Human authority station',
    description:
      'Your team reviews the proposal, clicks citations to inspect source documents, edits phrasing, and makes the final approval decision. Missing details remain clearly visible.',
    icon: UserCheck,
    tag: 'Human Review',
  },
  {
    step: '06',
    title: 'Send with control',
    headline: 'Explicit human confirmation',
    description:
      'Sends through the authorized corporate email account only after explicit human confirmation naming the recipient and proposal title. Never sends automatically.',
    icon: Send,
    tag: 'Controlled Dispatch',
  },
];

export const WorkflowSequence: React.FC = () => {
  return (
    <section id="workflow" className="py-20 md:py-28 bg-white border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-subtle text-brand border border-brand-border text-[11px] font-semibold uppercase tracking-wider">
            Connected Product Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            From raw request to approved response.
          </h2>
          <p className="text-sm sm:text-base text-slate leading-relaxed">
            A transparent six-stage pipeline that searches your verified knowledge, attributes
            every claim, and keeps your team in control of the final submission.
          </p>
        </div>

        {/* 6-Step Connected Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {WORKFLOW_STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-canvas/50 hover:bg-canvas rounded-2xl p-6 border border-border-subtle transition-all duration-200 hover:shadow-card hover:border-border-strong flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-border-subtle flex items-center justify-center text-brand font-bold shadow-subtle group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-brand" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-muted uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-border-subtle">
                        {item.tag}
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-muted">
                        {item.step}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-ink mb-1">{item.title}</h3>
                  <div className="text-xs font-semibold text-brand mb-2.5">
                    {item.headline}
                  </div>
                  <p className="text-xs text-slate leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-border-subtle/80 flex items-center justify-between text-[11px] text-slate-muted">
                  <span>Stage {index + 1} of 6</span>
                  <div className="flex items-center gap-1 text-slate font-medium">
                    <span>Grounded</span>
                    <ArrowRight className="w-3 h-3 text-brand" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reassurance Banner */}
        <div className="mt-12 bg-canvas rounded-2xl p-4 sm:p-5 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Zero Automated Sending</div>
              <div className="text-[11px] text-slate">
                Lunova drafts responses with verifiable evidence citations. Final dispatch strictly requires explicit human sign-off.
              </div>
            </div>
          </div>
          <a
            href="#interactive-demo"
            className="text-xs font-semibold text-brand hover:underline shrink-0"
          >
            Try the interactive preview &rarr;
          </a>
        </div>
      </div>
    </section>
  );
};
